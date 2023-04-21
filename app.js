//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const testFolder = 'public/vids/';

const fs = require('fs');
const multer = require('multer') 
var list = "";
const path = require('path')
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { config } = require('process');

const { log } = require('console');


// NODE APP CONFIGS
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


// PASSPORT INITIALIZATION

app.use(session({
    secret: "My Key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// MONGODB CONNECTION
mongoose.connect("mongodb+srv://Person_UK:Prateek006@cluster0.qznrmoc.mongodb.net/mbDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//PASSPORT COOKIES
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//for video
var storage = multer.diskStorage({
    destination: function (req, file, callback){
        var dir = 'public/files/vids'

        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        callback(null, dir)
    },
    filename: function(req, file, callback){
        callback(null, file.originalname)
    }
})

var upload = multer({storage: storage}).array('files', 12)

app.post('/upload', (req,res,next) => {

    upload(req,res,function(err){
    if(err){
        return res.status(404).send("Something went wrong")
    }
    console.log(`Upload complete of vid `);
})
})

// for image
var storage = multer.diskStorage({
    destination: function (req, file, callback){
        var dir = 'public/files/images'

        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        callback(null, dir)
    },
    filename: function(req, file, callback){
        callback(null, file.originalname)
    }
})

var upload = multer({storage: storage}).array('files', 12)

app.post('/upload_image', (req,res,next) => {

    upload(req,res,function(err){
    if(err){
        return res.status(404).send("Something went wrong")
    }
    console.log('upload complete of pic');
    res.redirect("/photos");
})
})


// ROOTS FOR THE SERVER
app.get("/register", function (req, res) {      //register get
    res.render("register");
});

app.post("/register", function (req, res) {     //register post

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/home");
            });
        }
    });

});

app.get("/", function (req, res) {      //login get
    res.render("login");
});

app.post("/", function (req, res) {     //login post

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/home");
            });
        }
    });
});


app.get("/home", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("home");
    } else {
        res.redirect("/");
    }
});

app.get("/music", function (req, res) {
    const directoryPath = path.join(__dirname, 'public/files/images/')
    if (req.isAuthenticated()) {
        fs.readdir(directoryPath, function(err, files) {
            if (err) {
              return console.log('Unable to scan directory: ' + err);
            }
            const music = files.filter(function(file) {
              return path.extname(file).toLowerCase() === '.mp3';
            });
            res.render('music.ejs', { music });
          });
    } else {
        res.redirect("music");
    }
});

app.get("/videos", function (req, res) {
    const viewsData= {
        pics: testFolder.pics
        
    }
    const directoryPath = path.join(__dirname, 'public/files/images');
    if (req.isAuthenticated()) {
        fs.readdir(directoryPath, function(err, files) {
            if (err) {
              return console.log('Unable to scan directory: ' + err);
            }
            const videos = files.filter(function(file) {
              return path.extname(file).toLowerCase() === '.mp4';
            });
            res.render('videos.ejs', { videos });
          });
    } else {
        res.redirect("/");
    }
});

//download 

const directoryPath = path.join(__dirname, 'public/files/images');


app.get('/download', (req, res) => {
    const fileName = req.query.file;
    const filePath = path.join(directoryPath, fileName);
    res.download(filePath, err => {
      if (err) {
        console.log('Unable to download file: ' + err);
      }
      
    });
  });
  

app.get("/documents", function (req, res) {
    const viewsData= {
        pics: testFolder.pics
        
    }
    const directoryPath = path.join(__dirname, 'public/files/images');
    if (req.isAuthenticated()) {
        fs.readdir(directoryPath, function(err, files) {
            if (err) {
              return console.log('Unable to scan directory: ' + err);
            }
            const docs = files.filter(function(file) {
                return path.extname(file).toLowerCase() === '.xls' || path.extname(file).toLowerCase() === '.pdf' || path.extname(file).toLowerCase() === '.docx';
            });
            res.render('docs.ejs', { docs });
          });
    } else {
        res.redirect("/");
    }
});

app.get("/photos", function (req, res) {
    const directoryPath = path.join(__dirname, 'public/files/images/')
    if (req.isAuthenticated()) {
        fs.readdir(directoryPath, function(err, files) {
            if (err) {
              return console.log('Unable to scan directory: ' + err);
            }
            const images = files.filter(function(file) {
              return path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.png' || path.extname(file).toLowerCase() === '.jpeg';
            });
            res.render('photos.ejs', { images });
          });
    } else {
        res.redirect("photos");
    }
});

app.get("/player", function (req, res) {
    res.render("player")
});


app.listen(3000, '0.0.0.0', function () {
    console.log("server started at port 3000");
});