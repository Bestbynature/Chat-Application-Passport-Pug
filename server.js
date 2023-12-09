"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const { ObjectID } = require('mongodb');
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

app.set("view engine", "pug");

app.set("views", "./views/pug");

fccTesting(app);
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route("/").get((req, res) => {
  res.render("index", { title: 'Hello', message: 'Please log in' });
});

const session = require('express-session');
const passport = require('passport');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());

app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, doc);
  // myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
  //   done(null, doc);
  // });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
