const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

// set view engine to use ejs
app.set('view engine', 'ejs');

/****************************
  Middleware
 ****************************/

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/****************************
  Helper functions
 ****************************/

const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += chars[Math.floor(Math.random() * 62)];
  }
  return randomString;
};

const findUserById = function(id) {
  for (const key in users) {
    if (id === key) {
      return users[key];
    }
  }
  return null;
};

const findUserByEmail = function(email) {
  for (const key in users) {
    if (email === users[key].email) {
      return users[key];
    }
  }
  return null;
};

/****************************
  Data
 ****************************/

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  'eUzup9': {
    id: 'eUzup9',
    email: 'jim@testman.com',
    password: 'password1'
  }
};

/****************************
  Routes
 ****************************/

// GET Routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: findUserById(req.cookies.id) };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user: findUserById(req.cookies.id) };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: findUserById(req.cookies.id) };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  const templateVars = { user: findUserById(req.cookies.id), errorMsg: null };
  res.render('login', templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = { user: findUserById(req.cookies.id), errorMsg: null };
  res.render('registration', templateVars);
});

// POST Routes
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  
  if (email && password && !findUserByEmail(email)) {
    users[id] = {
      id,
      email,
      password
    };
    res.cookie('id', id);
    res.redirect('/urls');
  } else if (findUserByEmail(email)) {
    res.render('registration', { user: null, errorMsg: 'Email already in use' });
  } else {
    res.status(400);
    res.render('registration', { user: null, errorMsg: 'Invalid email or password' });
  }
  console.log(users)
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);

  if (user && user.password === password) {
    res.cookie('id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403);
    res.render('login', { user: null, errorMsg: 'Invalid email or password' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('id');
  res.redirect('/urls');
});

// DELETE Routes
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});