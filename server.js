"use strict";
require("dotenv").config();
const routes = require("./routes.js");
const auth = require("./auth.js");
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.set("view engine", "pug");

app.set("views", "./views/pug");

fccTesting(app);
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client
    .db("database")
    .collection("user-collection-fcc-express");


  auth(app, myDataBase);
  routes(app, myDataBase);

  io.on('connection', socket => {
    console.log('A user has connected');
  });

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
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});