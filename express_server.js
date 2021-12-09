const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080;

// set view engine to use ejs
app.set('view engine', 'ejs');

/****************************
  Middleware
 ****************************/

app.use(bodyParser.urlencoded({extended: true}));

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
    id: 'eUzup9',
    email: 'jim@testman.com',
    password: bcrypt.hashSync('password1', 10)
  }
};


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
  
  const urlsForUser = function(id) {
    let urls = {};
    for (const url in urlDatabase) {
      if(urlDatabase[url].userID === id) {
        urls[url] = urlDatabase[url];
      }
    }
    return urls;
  }

  const isUsersUrl = function(id, url) {
    return urlDatabase[url].userID === id;
  }

/****************************
  Routes
 ****************************/

// GET Routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies.id), user: findUserById(req.cookies.id) };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (req.cookies.id) {
    const templateVars = { user: findUserById(req.cookies.id) };
    res.render('urls_new', templateVars);
  } else {
    res.status(403);
    res.render('registration', { user: null, errorMsg: 'Please register or login to create a new tinyURL.'})
  }
});

app.get('/urls/:shortURL', (req, res) => {
  if (req.cookies.id && isUsersUrl(req.cookies.id, req.params.shortURL)) {
    const templateVars = { shortURL: req.params.shortURL, url: urlDatabase[req.params.shortURL], user: findUserById(req.cookies.id), errorMsg: null };
    res.render('urls_show', templateVars);
  } else if (req.cookies.id && !isUsersUrl(req.cookies.id, req.params.shortURL)) {
    const templateVars = { shortURL: req.params.shortURL, url: urlDatabase[req.params.shortURL], user: findUserById(req.cookies.id), errorMsg: 'This isn\'t your url, so you cannot update it.' };
    res.render('urls_show', templateVars);
  } else {
    res.status(403);
    res.render('registration', { user: null, errorMsg: 'Please register or login to create a new tinyURL.'})
  }
});

app.get('/u/:shortURL', (req, res) => {
  if(urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].visits++;
    res.redirect(longURL);
  } else {
    res.render('error', { url: req.params.shortURL });
  }
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
  if (req.cookies.id) {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { 
      longURL,
      userID: req.cookies.id,
      visits: 0
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403);
    res.write('Please register or login to create a new tiny URL');
    res.end();
  }
});

app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const visits = urlDatabase[shortURL].visits;

  if(isUsersUrl(req.cookies.id, shortURL)) {
    urlDatabase[shortURL] = { 
      longURL, 
      visits,
      userID: req.cookies.id
    };
    res.redirect('/urls');
  } else {
    res.status(403);
    res.write('You isn\'t your url, you cannot update it.');
    res.end();
  }
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  
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
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);

  if (user && bcrypt.compareSync(password, user.password)) {
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
  if(isUsersUrl(req.cookies.id, shortURL)) {
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