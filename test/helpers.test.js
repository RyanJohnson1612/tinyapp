const assert = require('chai').assert;

const { generateRandomString, findUserById, findUserByEmail, urlsForUser, isUsersUrl } = require('../helpers');

const testUsers = {
  "userRandomID": {
    userID: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    userID: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrls = { 
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'userRandomID',
    visits: 0
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'userRandomID',
    visits: 0
  }
}

describe('findUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const user = findUserByEmail('user@example.com', testUsers);
    const expectedID = 'userRandomID';

    assert.strictEqual(user.userID, expectedID);
  });
  it('should return null if user is not in database', () => {
    const user = findUserByEmail('userdoesntexist@example.com', testUsers);  

    assert.isNull(user);
  });
});

describe('generateRandomString', () => {
  it('should return a string of 6 characters', () => {
    const string = generateRandomString();

    assert.strictEqual(string.length, 6);
  });
});

describe('findUserById', () => {
  it('should return a user with a valid id', () => {
    const user = findUserById('user2RandomID', testUsers);
    const expectedEmail = "user2@example.com";

    assert.strictEqual(user.email, expectedEmail);
  });

  it('should return null if a user with the id is not in the database', () => {
    const user = findUserById('userdoesntexist', testUsers);  

    assert.isNull(user);
  })
});

describe('urlsForUser', () => {
  it('should return an object containing the urls for the user', () => {
    const urls = urlsForUser('userRandomID', testUrls);

    assert.isObject(urls);
    assert.strictEqual(Object.keys(urls).length, 2);
  });
  it('should return an empty object if the user does not have any urls', () => {
    const urls = urlsForUser('userRandomID2', testUrls);

    assert.isObject(urls);
    assert.strictEqual(Object.keys(urls).length, 0);
  });
  it('should return an empty object if the user does not exist', () => {
    const urls = urlsForUser('userdoesntexist', testUrls);

    assert.isObject(urls);
    assert.strictEqual(Object.keys(urls).length, 0);
  });
});

describe('isUsersUrl', () => {
  it('should return true if url belongs to user', () => {
    assert.isTrue(isUsersUrl('userRandomID', 'b2xVn2', testUrls));
  });
  it('should return false if url does not belongs to user', () => {
    assert.isFalse(isUsersUrl('userRandomID2', '9sm5xK', testUrls));
  });
  it('should return false if user does not exist', () => {
    assert.isFalse(isUsersUrl('userdoesntexist', 'b2xVn2', testUrls));
  });
  it('should return false if url does not exist', () => {
    assert.isFalse(isUsersUrl('userRandomID', 'urldoesntexist', testUrls));
  });
  it('should return false if url and user does not exist', () => {
    assert.isFalse(isUsersUrl('userdoesntexist', 'urldoesntexist', testUrls));
  });
});