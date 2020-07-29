// load .env data into process.env
require('dotenv').config({silent: true});

// Web server config
const PORT       = process.env.PORT || 8080;
const ENV        = process.env.ENV || "development";
const express    = require("express");
const bodyParser = require("body-parser");
const sass       = require("node-sass-middleware");
const app        = express();
const morgan     = require('morgan');
const cookieSession = require('cookie-session');

// PG database client/connection setup
const { Pool } = require('pg');
const dbParams = require('./lib/db.js');
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));
app.use(cookieSession({
  name: 'session',
  keys: ['thisismysuperlongstringtouseforcookiesessions', 'thisisasecondlongstring']
}));
// add req.session.user_id = user.id; to app.post login route

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const resourcesRoutes = require("./routes/resources");
const categoriesRoutes = require("./routes/categories");

// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/users", usersRoutes(db));
app.use("/resources", resourcesRoutes(db));
app.use("/categories", categoriesRoutes(db));
// Note: mount other resources here, using the same pattern above

// homepage not logged in
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.render("1_homepage_nl");
  } else {
    res.render("4_homepage_logged");
  }
});

// GET registration page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.render("4_homepage_logged");
  } else {
    res.render("2_register");
  }
});

    // HOA POST registration page

app.post("/register", (req,res) => {

  const user = req.body
  console.log(user)

  const query= {
  text:`INSERT INTO users (username, first_name, last_name, email, password, profile_image_url)
  VALUES ($1, $2, $3,$4,$5,$6)
  RETURNING *`, values : [user.username, user.first_name, user.last_name,user.email, user.password, user.profile_image_url]
  };

   db
  .query(query)
  .then(result => {
    console.log(result.rows[0].id);
    // console.log(users.row.id);
    // req.session = users.row.id;
    res.redirect("/")
  })
  .catch(err => console.log(err))

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
