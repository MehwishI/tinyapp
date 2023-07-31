//import modules
const express = require("express");
const morgan = require("morgan");

var cookieSession = require("cookie-session");

const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helpers");

let { users, urlDatabase } = require("./data");
var methodOverride = require("method-override");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

//middleware
app.use(morgan("dev"));

//for POST request, to parse the data sent as buffer into more readable data type
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
// override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

//view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>User!</b></body></html>\n");
});

//renders view to show list of all urls
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("Please login to view Urls!");
  }
  const urlList = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    urls: urlList,
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});
//renders a page to add a new url
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("urls_new", templateVars);
});
//renders a view to show url details
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("Please login to view the Url!");
  }
  //get urls list for this logged in user
  const urlListObj = urlsForUser(req.session.user_id, urlDatabase);

  //increases the no.of visits for this particular shotrt url id
  urlDatabase[req.params.id].url_visited++;

  //if the requested short URL (id) in found in the urls list of this user then
  //pass this url data to templateVars
  if (Object.keys(urlListObj).includes(req.params.id)) {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      createdDate: urlDatabase[req.params.id].createdDate,
      user: users[req.session.user_id],
      url_visited: urlDatabase[req.params.id].url_visited,
      current_date:
        new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
    };

    res.render("urls_show", templateVars);
  } else {
    res
      .status(403)
      .send("This short url does not belong to the current logged in user!");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res
      .status(403)
      .send("Only logged in users can submit a new url, Please login first.");
    //res.redirect("/login");
  }
  const newUrl = req.body;
  //generating a new short Url for the given long url
  newUrl.id = generateRandomString(6);

  //defining a new key to url database
  urlDatabase[newUrl.id] = {
    longURL: newUrl.longURL,
    userID: req.session.user_id,
    createdDate:
      new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
    url_visited: 0,
  };

  res.redirect(`/urls/${newUrl.id}`);
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
  if (longURL === "") {
    res.status(404).send("This short URL does not exist in the system! ");
  }
});
//register get route
app.get("/register", (req, res) => {
  templateVars = { user: null };
  res.render("register", templateVars);
});
//register post route
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email or password is empty");
  }
  //check if user already exists
  if (!getUserByEmail(req.body.email, users)) {
    const userId = generateRandomString(6);
    const emailFromForm = req.body.email;

    const passwordFromBody = req.body.password;
    //hash the password and then saves it in users object
    const hashedPassword = bcrypt.hashSync(passwordFromBody, 10);

    users[userId] = {
      id: userId,
      email: emailFromForm,
      password: hashedPassword,
    };

    //set current session userid equals to current user id
    req.session.user_id = userId;
    res.redirect("/urls");
  } else {
    res.status(400).send("User Email already exists!");
    //res.redirect("/register");
  }
});
//delete
app.delete("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("Please login to delete the Url!");
  }
  const id = req.params.id;

  if (Object.keys(urlDatabase).includes(id)) {
    //get urls list for this logged in user
    const urlListObj = urlsForUser(req.session.user_id, urlDatabase);
    //console.log("urlListObj:", urlListObj);

    //if the requested short URL (id) in found in the urls list of this user then
    //update the url
    if (Object.keys(urlListObj).includes(id)) {
      delete urlDatabase[id];
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
app.put("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("Please login to edit the Url!");
  }
  if (Object.keys(urlDatabase).includes(req.params.id)) {
    //get urls list for this logged in user
    const urlListObj = urlsForUser(req.session.user_id, urlDatabase);

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

//gets login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("login", templateVars);
});
app.post("/login", (req, res) => {
  const emailLogin = req.body.email;
  const pwdLogin = req.body.password;

  //find the user that matches with given email
  let userFound = getUserByEmail(emailLogin, users);

  //if a user is found matched with given email, then compare password
  if (userFound) {
    //hash provided password and compare with saved password.
    if (bcrypt.compareSync(pwdLogin, userFound.password)) {
      //set login session cookie as user_id
      req.session.user_id = userFound.id;
      res.redirect("/urls");
    } else {
      res
        .status(403)
        .send("User Email or Password is incorrect! Please try again.");
    }
  } else {
    res.status(403).send("User Not found!");
  }
});
//logout clears cookies
app.post("/logout", (req, res) => {
  req.session = null;
  //res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});
