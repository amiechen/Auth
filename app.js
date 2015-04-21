var dotenv = require('dotenv');
dotenv.load();

var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');
var sessions = require('client-sessions');
var bcrypt = require('bcryptjs');
var csrf = require('csurf');

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
app.use(sessions({
  cookieName: 'session',
  secret: 'apsoidfp1-2039j0sdjf09whesofdi163s*o2', //unique string for encription/decription
  duration: 30*60*1000, //log you out in 30 min
  activeDuration: 5 * 50 * 1000, //lengthen their session for 5 min
  httpOnly: true, //browser javascript won't be accessing stuff ever!
  secure: true, //only use cookies over https
  ephemeral: true //delete this cookie when the browser is closed
}));

app.use(function(req, res, next){
  if(req.session && req.session.user){
    User.findOne({email: req.session.user.email}, function(err, user){
      if(user){
        req.user = user;
        delete req.user.password;
        req.session.user = req.user;
        res.locals.user = req.user;
      }
      next();
    });
  }else{
    next();
  }
});

//make user's http request available to req.body 
app.use(bodyParser.urlencoded({extended: true}));

// use csrf
app.use(csrf());

function requireLogin (req, res, next) {
  if(!req.user){
    res.redirect('/login');
  } else {
    next();
  }
}


app.get('/', function(req, res) {
  res.render('index.jade');
});

app.get('/register', function(req, res) {
  res.render('register.jade',{ csrfToken: req.csrfToken() });//
});
app.post('/register', function(req, res) {
  //send whatever user filled in the form back to browser
  //res.json(req.body);
  var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
  var user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hash
  });

  user.save(function(err){
    if (err) {
      var err = 'something bad happend try again!';
      if(err.code === 11000) {
        error = 'That email is already taken'
      }

      res.render('register.jade', {error: error});
    } else {
      res.redirect('/dashboard');
    }
  })
});

app.get('/login', function(req, res) {
  res.render('login.jade',{ csrfToken: req.csrfToken() });//
});

app.post('/login', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    if(!user){
      res.render('login.jade', {error: 'User doesnt exist'});
    } else {
      if (bcrypt.compareSync(req.body.password, user.password)){
        req.session.user = user;
        res.redirect('/dashboard');
      } else {
        res.render('login.jade', {error: 'User doesnt exist'});
      }
    }
  });
});

app.get('/dashboard', requireLogin, function(req, res) {
  res.render('dashboard.jade');
});

app.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});
app.listen(8080);
