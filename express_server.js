const express = require("express");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

//middleware
app.use(morgan("dev"));
app.use(cookieParser());
//for POST request, to parse the data sent as buffer into more readable data type
app.use(express.urlencoded({ extended: true }));

//view engine
app.set("view engine", "ejs");

function generateRandomString(i) {
  return Math.random()
    .toString(36)
    .slice(2, i + 2);
}
//finds the given user email in users object (database) and returns the user
function getUserByEmail(userEmail) {
  for (let id in users) {
    if (users[id].email === userEmail) {
      return users[id];
    }
  }
  return null;
}

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};
//users database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//renders view to show list of all urls
app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});
//renders to a page to add a new url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});
//renders a view to show url details
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.post("/urls", (req, res) => {
  const newUrl = req.body;
  newUrl.id = generateRandomString(6);

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
//register get route
app.get("/register", (req, res) => {
  templateVars = { user: null };
  res.render("register", templateVars);
});
//register post route
app.post("/register", (req, res) => {
  const userId = generateRandomString(6);
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email or password is empty");
    res.redirect("/register");
  }
  //check if user already exists
  if (!getUserByEmail(req.body.email)) {
    const emailFromForm = req.body.email;
    const passwordFromForm = req.body.password;

    users[userId] = {
      id: userId,
      email: emailFromForm,
      password: passwordFromForm,
    };

    res.cookie("user_id", userId);
    res.redirect("/urls");
  } else {
    res.status(400).send("User Email already exists!");
    res.redirect("/register");
  }
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
app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("login", templateVars);
});
app.post("/login", (req, res) => {
  const emailLogin = req.body.email;
  const pwdLogin = req.body.password;

  //find the user that matches with given email
  let userFound = getUserByEmail(emailLogin);

  //if a user is found matched with given email, then compare password
  if (userFound) {
    if (userFound.password === pwdLogin) {
      //set cookie equal to user id
      res.cookie("user_id", userFound.id);
      res.redirect("/urls");
    } else {
      res
        .status(403)
        .send("User Email or Password is incorrect! Please try again.");
    }
  } else {
    res.status(403).send("User Not found!");
    res.redirect("/login");
  }
});
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});
