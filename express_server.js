const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");
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
}));
app.use(methodOverride('_method'));

/****************************
  Data
 ****************************/

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'eUzup9',
    visits: 0,
    uniqueVisits: 0,
    dateCreated: Date.now()
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'eUzup9',
    visits: 0,
    uniqueVisits: 0,
    dateCreated: Date.now()
  }
};

const users = {
  'eUzup9': {
    userID: 'eUzup9',
    email: 'test@user.com',
    password: bcrypt.hashSync('123456', 10)
  }
};

/****************************
  Routes
 ****************************/
app.get('/', (req, res) => {
  if (!req.session.userID) {
    res.redirect('login');
  }
  res.redirect('/urls');
});

// Show url index page
app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const templateVars = { urls: urlsForUser(userID, urlDatabase), user: findUserById(userID, users) };
  res.render('urls_index', templateVars);
});

// Show new url form
app.get('/urls/new', (req, res) => {
  const userID = req.session.userID;
  // Check that user is logged in
  if (userID) {
    const templateVars = { user: findUserById(userID, users) };
    res.render('urls_new', templateVars);
  } else {
    res.status(403);
    res.redirect('/login');
  }
});

// Show url update form
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;

  // Check if url exists in database
  if (!Object.keys(urlDatabase).includes(shortURL)) {
    const templateVars = { shortURL: shortURL, url: urlDatabase[shortURL], user: findUserById(userID, users), errorMsg: `TinyURL "${shortURL}" does not exist` };
    res.render('urls_show', templateVars);
  }
  // Check that user is logged in and that url belongs to user
  if (userID && isUsersUrl(userID, shortURL, urlDatabase)) {
    const templateVars = { shortURL: shortURL, url: urlDatabase[shortURL], user: findUserById(userID, users), errorMsg: null };
    res.render('urls_show', templateVars);
  } else if (userID && !isUsersUrl(userID, shortURL, urlDatabase)) {
    const templateVars = { shortURL: shortURL, url: urlDatabase[shortURL], user: findUserById(userID, users), errorMsg: 'This isn\'t your url, so you cannot update it.' };
    res.render('urls_show', templateVars);
  } else {
    res.status(403);
    res.render('registration', { user: null, errorMsg: 'Please register or login to create a new tinyURL.'});
  }
});

// Short url redirect route
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  // Check that url exists in database
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;

    // If user who clicked link hasn't visited it before add a cookie and increment unique visits
    if (!req.session.visited) {
      req.session.visited = true;
      urlDatabase[shortURL].uniqueVisits++;
    }
    urlDatabase[shortURL].visits++;
    res.redirect(longURL);
  } else {
    res.render('error', { url: shortURL });
  }
});

// Show login form
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  }

  const templateVars = { user: findUserById(req.session.userID, users), errorMsg: null };
  res.render('login', templateVars);
});

// Show registration form
app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  }

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
      visits: 0,
      uniqueVisits: 0,
      dateCreated: Date.now()
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403);
    res.write('Please register or login to create a new tiny URL');
    res.end();
  }
});

// Create new users
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  
  // Check that input are valid and user doesn't already exist'
  if (email && password && !findUserByEmail(email, users)) {
    users[id] = {
      userID: id,
      email,
      password: bcrypt.hashSync(password, 10)
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
    res.render('login', { user: null, errorMsg: 'Incorrect email or password' });
  }
});

// User logout route
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// PUT Routes

// Update short url
app.put('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const visits = urlDatabase[shortURL].visits;

  // Check that url belongs to user
  if (isUsersUrl(req.session.userID, shortURL, urlDatabase)) {
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

// DELETE Routes

// Delete short url
app.delete('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;

  // Check if url belongs to user
  if (isUsersUrl(userID, shortURL, urlDatabase)) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else if (userID && !isUsersUrl(userID, shortURL, urlDatabase)) {
    const templateVars = { shortURL: shortURL, url: urlDatabase[shortURL], user: findUserById(userID, users), errorMsg: 'This isn\'t your url, so you cannot delete it.' };
    res.render('urls_show', templateVars);
  } else {
    res.status(403);
    res.write('This isn\'t your url, you cannot delete it.');
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});