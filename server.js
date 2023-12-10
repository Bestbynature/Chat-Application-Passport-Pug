"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const { ObjectID } = require("mongodb");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const passport = require("passport");

const app = express();

app.set("view engine", "pug");

app.set("views", "./views/pug");

passport.use(
  new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }),
);

fccTesting(app);
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client
    .db("database")
    .collection("user-collection-fcc-express");

  app.route("/").get((req, res) => {
    res.render("index", {
      showLogin: true,
      showRegistration: true,
      title: "Connected to Database",
      message: "Please login",
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      },
    );

    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/");
    }

  app.route("/profile")
    .get(ensureAuthenticated, (req, res) => {
      res.render("profile", { username: req.user.username });
    });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/register").post(
    (req, res, next)=>{
      myDataBase.findOne({username: req.body.username}, (err, user)=>{
        if(err) next(err);
        else if(user) res.redirect('/');
        else{
          myDataBase.insertOne({
            username: req.body.username,
            password: req.body.password
          }, (err, doc)=>{
            if(err) res.redirect('/');
            else next(null, doc.ops[0]);
          })
        }
      })
    }, passport.authenticate('local', {failureRedirect: '/'}), (req, res, next)=>{
      res.redirect('/profile');
    }
  )


  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );

  app.use(passport.initialize());

  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    // done(null, null);
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
