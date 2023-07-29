function getUserByEmail(userEmail, userDatabase) {
  for (let id in userDatabase) {
    if (userDatabase[id].email === userEmail) {
      return userDatabase[id];
    }
  }
  return undefined;
}

module.exports = { getUserByEmail };
