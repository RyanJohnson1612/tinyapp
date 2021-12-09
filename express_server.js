const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { generateRandomString, findUserById, findUserByEmail, urlsForUser, isUsersUrl } = require('./helpers');
const app = express();
const PORT = 8080;

// set view engine to use ejs
app.set('view engine', 'ejs');

/****************************
  Middleware
 ****************************/

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['2f680bb1-5a39-4b5b-926b-0617dcee7623', '3bbf5d82-f02d-49e0-a45e-2ef0a70b9021']
}))

/****************************
  Data
 ****************************/

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'eUzup9',
    visits: 0
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'eUzup9',
    visits: 0
  }
};

const users = {
  'eUzup9': {
    userID: 'eUzup9',
    email: 'jim@testman.com',
    password: bcrypt.hashSync('password1', 10)
  }
};

/****************************
  Routes
 ****************************/
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Show url index page
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.userID, urlDatabase), user: findUserById(req.session.userID, users) };
  res.render('urls_index', templateVars);
});

// Show new url form
app.get('/urls/new', (req, res) => {
  // Check that user is logged in
  if (req.session.userID) {
    const templateVars = { user: findUserById(req.session.userID, users) };
    res.render('urls_new', templateVars);
  } else {
    res.status(403);
    res.render('registration', { user: null, errorMsg: 'Please register or login to create a new tinyURL.'})
  }
});

// Show url update form
app.get('/urls/:shortURL', (req, res) => {
  // Check that user is logged in and that url belongs to user
  if (req.session.userID && isUsersUrl(req.session.userID, req.params.shortURL, urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL, url: urlDatabase[req.params.shortURL], user: findUserById(req.session.userID, users), errorMsg: null };
    res.render('urls_show', templateVars);
  } else if (req.session.userID && !isUsersUrl(req.session.userID, req.params.shortURL, urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL, url: urlDatabase[req.params.shortURL], user: findUserById(req.session.userID, users), errorMsg: 'This isn\'t your url, so you cannot update it.' };
    res.render('urls_show', templateVars);
  } else {
    res.status(403);
    res.render('registration', { user: null, errorMsg: 'Please register or login to create a new tinyURL.'})
  }
});

// Short url redirect route
app.get('/u/:shortURL', (req, res) => {

  // Check that url exists in database
  if(urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].visits++;
    res.redirect(longURL);
  } else {
    res.render('error', { url: req.params.shortURL });
  }
});

// Show login form
app.get('/login', (req, res) => {
  const templateVars = { user: findUserById(req.session.userID, users), errorMsg: null };
  res.render('login', templateVars);
});

// Show registration form
app.get('/register', (req, res) => {
  const templateVars = { user: findUserById(req.session.userID, users), errorMsg: null };
  res.render('registration', templateVars);
});

// POST Routes

// Create new short url
app.post('/urls', (req, res) => {

  // Check that user is logged in
  if (req.session.userID) {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { 
      longURL,
      userID: req.session.userID,
      visits: 0
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403);
    res.write('Please register or login to create a new tiny URL');
    res.end();
  }
});

// Update short url
app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const visits = urlDatabase[shortURL].visits;

  // Check that url belongs to user 
  if(isUsersUrl(req.session.userID, shortURL, urlDatabase)) {
    urlDatabase[shortURL] = { 
      longURL, 
      visits,
      userID: req.session.userID
    };
    res.redirect('/urls');
  } else {
    res.status(403);
    res.write('You isn\'t your url, you cannot update it.');
    res.end();
  }
});

// Create new users
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  
  // Check that input are valid and user doesn't already exist'
  if (email && password && !findUserByEmail(email, users)) {
    users[id] = {
      id,
      email,
      password
    };
    req.session.userID = id;
    res.redirect('/urls');
  } else if (findUserByEmail(email, users)) {
    res.render('registration', { user: null, errorMsg: 'Email already in use' });
  } else {
    res.status(400);
    res.render('registration', { user: null, errorMsg: 'Invalid email or password' });
  }
});

// User login route
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  
  // Check that user exists and that hashed passwords match
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userID = user.userID;
    res.redirect('/urls');
  } else {
    res.status(403);
    res.render('login', { user: null, errorMsg: 'Invalid email or password' });
  }
});

// User logout route
app.post('/logout', (req, res) => {
  req.session.userID = null;
  res.redirect('/urls');
});

// Delete short url
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  // Check if url belongs to user
  if(isUsersUrl(req.session.userID, shortURL, urlDatabase)) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(403);
    res.write('This isn\'t your url, you cannot delete it.');
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});