const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;

// set view engine to use ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += chars[Math.floor(Math.random() * 62)];
  }
  return randomString;
}

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

/****************************
  Routes
 ****************************/

// GET Routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

// POST routes
app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send('Ok');
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});