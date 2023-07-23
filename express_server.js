const express = require("express");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080
app.use(morgan("dev"));

app.use(cookieParser());

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
}

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};
//for POST request, to parse the data sent as buffer into more readable data type
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//renders view to show list of all urls
app.get("/urls", (req, res) => {
  console.log(req.cookies["username"]);
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"] ? req.cookies["username"] : "",
  };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"] ? req.cookies["username"] : "",
  };
  res.render("urls_new", templateVars);
});
//renders a view to show url details
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.post("/urls", (req, res) => {
  const newUrl = req.body;
  newUrl.id = generateRandomString();

  urlDatabase[newUrl.id] = newUrl.longURL;
  res.redirect("/urls");
});
//redirects to the long url in browser
app.get("/u/:id", (req, res) => {
  let longURL = "";
  for (let shortUrl in urlDatabase) {
    if (shortUrl === req.params.id) {
      longURL = urlDatabase[shortUrl];
    }
  }
  res.redirect(longURL);
});

//delete
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];

  res.redirect("/urls");
});
//edit
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newLongUrl;

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  //set cookie equal to username
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});
