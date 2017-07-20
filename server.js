"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const GOOGLEMAPS_APIKEY = process.env.GOOGLEMAPS_APIKEY;
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

app.get("/maps", (req, res) => {
    console.log("HERE 1");
    knex('maps')
      .select('*')
      .from('maps')
      .then((results) => {
        res.json(results)
      })
      .catch(function(error) {
        console.log(error)
    console.log("HERE 3");
      })
});

app.get("/maps/:user_id", (req, res) => {
    knex('users_maps')
      .select('*')
      .from('users_maps')
      .where({user_id: req.params.user_id})
      .then((results) => {
        res.json(results)
      })
      .catch(function(error) {
        console.log(error)
      })
});

app.get("/maps/:map_id/points", (req, res) => {
    knex('points')
      .select('*')
      .from('points')
      .where({map_id: req.params.map_id})
      .then((results) => {
        res.json(results)
      })
      .catch(function(error) {
        console.log(error)
      })
});

app.post("/point", (req, res) => {
    console.log(req.body);
  console.log(req.body.title)
    knex('points')
      .insert (
      {
       title       : req.body.title,
       description : req.body.description,
       image       : req.body.image,
       latitude    : req.body.latitude,
       longitude   : req.body.longitude,
       map_id      : req.body.map_id,
       user_id     : req.body.user_id
      })
      .returning('id')
      .then((results) => {
        let templateVars = { googleMapsAPIKey: GOOGLEMAPS_APIKEY };
        res.render("index", templateVars);
      });
})

app.post("/users_map", (req, res)=>{
    console.log(req.body)
    knex('users_maps')
      .insert(
      {
       user_id      : req.body.user_id,
       map_id       : req.body.map_id,
       favourite    : req.body.favourite,
       contribution : req.body.contribution
      })
      .then((results) => {
        let templateVars = { googleMapsAPIKey: GOOGLEMAPS_APIKEY };
        res.render("index", templateVars);
      });
  })

app.post("/map", (req, res) => {
  console.log(req.body.title)
    knex('maps')
      .insert (
      {
       creator_id : req.body.creator_id,
       title      : req.body.title,
       latitude   : req.body.latitude,
       longitude  : req.body.longitude
      })
      .returning('id')
      .then((results) => {
        let templateVars = { googleMapsAPIKey: GOOGLEMAPS_APIKEY };
        res.render("index", templateVars);
      });
});

// Home page
app.get("/", (req, res) => {
  let templateVars = { googleMapsAPIKey: GOOGLEMAPS_APIKEY };
  res.render("index", templateVars);
});


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
