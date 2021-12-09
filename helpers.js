const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += chars[Math.floor(Math.random() * 62)];
  }
  return randomString;
};

const findUserById = function(id, database) {
  for (const user in database) {
    if (id === user) {
      return database[user];
    }
  }
  return null;
};

const findUserByEmail = function(email, database) {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return null;
};

const urlsForUser = function(id, database) {
  let urls = {};
  for (const url in database) {
    if(database[url].userID === id) {
      urls[url] = database[url];
    }
  }
  return urls;
};

const isUsersUrl = function(id, url, database) {
  if(database[url]) {
    return database[url].userID === id;
  }
  return false;
};

module.exports = {
  generateRandomString,
  findUserById,
  findUserByEmail,
  urlsForUser,
  isUsersUrl
};