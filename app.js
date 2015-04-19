var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var User = mongoose.model('User', new Schema({
  id: ObjectId,
  firstName: String,
  lastName: String,
  email: {type: String, unique: true},
  password: String
}));

var app = express();
app.set('view engine', 'jade');
app.locals.pretty = true;

//connect to mongo
mongoose.connect('mongodb://localhost/newauth');

//middleware 
//make user's http request available to req.body 
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
  res.render('index.jade');
});

app.get('/register', function(req, res) {
  res.render('register.jade');
});
app.post('/register', function(req, res) {
  //send whatever user filled in the form back to browser
  //res.json(req.body);
  var user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password
  });

  user.save(function(err){
    if (err) {
      var err = 'something bad happend try again!';
      if(err.code === 11000) {
        error = 'That email is already taken'
      }

      res.render('register.jade', {error: error});
    } else {
      res.redirect('/login');
    }
  })
});

app.get('/login', function(req, res) {
  res.render('login.jade');
});

app.get('/dashboard', function(req, res) {
  res.render('dashboard.jade');
});

app.get('/logout', function(req, res) {
  res.redirect('/');
});
app.listen(3000);
