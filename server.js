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
const passportSocketIo = require("passport.socketio");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const cookieParser = require("cookie-parser");


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

  
  function onAuthorizeSuccess(data, accept) {
    console.log("successful connection to socket.io");
    accept(null, true);
  }

  function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log("failed connection to socket.io:", message);
    accept(null, false);
  }

  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail,
    }),
  );

  let currentUsers = 0;
  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });
    console.log('user ' + socket.request.user.username + ' connected');
    socket.on('disconnect', () => {
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false
      });
    });

    socket.on('chat message', (message) => {
      io.emit('chat message', { name: socket.request.user.name, message });
    });
  });

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      key: "express.sid",
      store: store,
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