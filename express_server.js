const express = require("express");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

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
  // b2xVn2: "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com",

  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

//function to find urls registered by the logged in user
function urlsForUser(loggedUserId) {
  const urlList = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === loggedUserId) {
      urlList[url] = urlDatabase[url];
    }
  }

  return urlList;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//renders view to show list of all urls
app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(400).send("Please login to view Urls!");
  }
  const urlList = urlsForUser(req.cookies["user_id"]);
  const templateVars = {
    urls: urlList,
    user: users[req.cookies["user_id"]],
  };
  //console.log("templateVars:", templateVars);
  res.render("urls_index", templateVars);
});
//renders to a page to add a new url
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});
//renders a view to show url details
app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(400).send("Please login to view the Url!");
  }
  //get urls list for this logged in user
  const urlListObj = urlsForUser(req.cookies["user_id"]);
  console.log("urlListObj", urlListObj);
  //if the requested short URL (id) in found in the urls list of this user then
  //pass this url data to templateVars
  if (Object.keys(urlListObj).includes(req.params.id)) {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.cookies["user_id"]],
    };
    res.render("urls_show", templateVars);
  } else {
    res
      .status(403)
      .send("This short url does not belong to the logged in usser!");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Only logged in users can submit a new url");
    res.redirect("/login");
  }
  const newUrl = req.body;
  //generating a new short Url for the given long url
  newUrl.id = generateRandomString(6);

  //defining a new key to url database
  urlDatabase[newUrl.id] = {
    longURL: newUrl.longURL,
    userID: req.cookies["user_id"],
  };
  console.log(urlDatabase);
  res.redirect("/urls");
});
//redirects to the long url in browser
app.get("/u/:id", (req, res) => {
  let longURL = "";
  for (let shortUrl in urlDatabase) {
    if (shortUrl === req.params.id) {
      longURL = urlDatabase[shortUrl].longURL;
      res.redirect(longURL);
    }
  }

  res.status(404).send("This short URL does not exist in the system! ");
});
//register get route
app.get("/register", (req, res) => {
  // if (req.cookies["user_id"] !== null) {
  //   res.redirect("/urls");
  // }
  templateVars = { user: null };
  res.render("register", templateVars);
});
//register post route
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email or password is empty");
    res.redirect("/register");
  }
  //check if user already exists
  if (!getUserByEmail(req.body.email)) {
    const userId = generateRandomString(6);
    const emailFromForm = req.body.email;

    const passwordFromBody = req.body.password;
    const hashedPassword = bcrypt.hashSync(passwordFromBody, 10);
    console.log(hashedPassword);

    users[userId] = {
      id: userId,
      email: emailFromForm,
      password: hashedPassword,
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
  if (!req.cookies["user_id"]) {
    res.status(400).send("Please login to delete the Url!");
  }
  const id = req.params.id;

  if (Object.keys(urlDatabase).includes(id)) {
    //get urls list for this logged in user
    const urlListObj = urlsForUser(req.cookies["user_id"]);

    //if the requested short URL (id) in found in the urls list of this user then
    //update the url
    if (Object.keys(urlListObj).includes(id)) {
      delete urlDatabase[id];
      res.redirect("/urls");
    } else {
      res
        .status(403)
        .send(
          "This url cannot be deleted as it does not belong to the logged in usser!"
        );
    }
  } else {
    res
      .status(403)
      .send(
        "This url cannot be deleted because it doesnot exist in the system!"
      );
  }

  res.redirect("/urls");
});
//edit a url
app.post("/urls/:id/edit", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(400).send("Please login to edit the Url!");
  }
  if (Object.keys(urlDatabase).includes(req.params.id)) {
    //get urls list for this logged in user
    const urlListObj = urlsForUser(req.cookies["user_id"]);

    //if the requested short URL (id) in found in the urls list of this user then
    //update the url
    if (Object.keys(urlListObj).includes(req.params.id)) {
      const id = req.params.id;
      urlDatabase[id].longURL = req.body.newLongUrl;
      res.redirect("/urls");
    } else {
      res
        .status(403)
        .send(
          "This url cannot be edited as it does not belong to the logged in usser!"
        );
    }
  } else {
    res
      .status(403)
      .send(
        "This url cannot be edited because it doesnot exist in the system!"
      );
  }
});
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("login", templateVars);
});
app.post("/login", (req, res) => {
  const emailLogin = req.body.email;
  const pwdLogin = req.body.password;

  //find the user that matches with given email
  let userFound = getUserByEmail(emailLogin);
  console.log(userFound);
  //if a user is found matched with given email, then compare password
  if (userFound) {
    if (bcrypt.compareSync(pwdLogin, userFound.password)) {
      //if (userFound.password === pwdLogin) {
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
