//finds the given user email in users object (database) and returns the user else returns undefined

function getUserByEmail(userEmail, userDatabase) {
  for (let id in userDatabase) {
    if (userDatabase[id].email === userEmail) {
      return userDatabase[id];
    }
  }
  return undefined;
}

//function to find urls registered by the logged in user
function urlsForUser(loggedUserId, urlDatabase) {
  const urlList = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === loggedUserId) {
      urlList[url] = urlDatabase[url];
    }
  }

  return urlList;
}
//generated a random string with a given length
function generateRandomString(i) {
  return Math.random()
    .toString(36)
    .slice(2, i + 2);
}
module.exports = { getUserByEmail, urlsForUser, generateRandomString };
