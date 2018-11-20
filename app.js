var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose=require('mongoose');
var bodyParser=require('body-parser');
const cors=require('cors');
const fileUpload=require('express-fileupload');
const favicon=require('serve-favicon')


var api = require('./routes/api');

var app = express();

app.use(cors({origin:'*'}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json({limit:"50mb"}));
app.use(bodyParser.urlencoded({extended:true, limit:"50mb"}));
app.use(fileUpload())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images','favicon.jpg')));

app.use('/', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('notfound');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoose.connect("mongodb://localhost:27017/write");

mongoose.connection.on('connected',()=>{
  app.listen(3000,()=>{
    console.log('Server Ready!');
  });
});

module.exports = app;
