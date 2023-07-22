const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

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

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
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
app.get("/u/:id", (req, res) => {
  let longURL = "";
  for (let shortUrl in urlDatabase) {
    if (shortUrl === req.params.id) {
      longURL = urlDatabase[shortUrl];
    }
  }

  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
