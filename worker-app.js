var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var H = require('./helpers/helpers.js');
var AWS = require('aws-sdk');

var credentials = H.extractAwsCredentials();
AWS.config.accessKeyId = credentials.accessKeyId;
AWS.config.secretAccessKey = credentials.secretAccessKey;
AWS.config.region = credentials.region;
AWS.config.logger = process.stdout;

var routes = require('./routes/worker-index');

var worker = express();

// view engine setup
worker.set('views', path.join(__dirname, 'views'));
worker.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//worker.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
worker.use(logger('dev'));
worker.use(bodyParser.json());
worker.use(bodyParser.urlencoded({ extended: false }));
worker.use(cookieParser());
worker.use(express.static(path.join(__dirname, 'public')));
worker.locals.moment = require('moment');

worker.use('/', routes);

var io = require('socket.io').listen(worker); // this tells socket.io to use our express server

io.sockets.on('connection', function (socket) {
    console.log('A new user connected!!');
});

io.sockets.on('message', function (message) {
    console.log('A new socketIO message received: ' + message);
    io.emit('message', message);
});
io.sockets.on('error', function(message) {
    console.log('Socket IO Error: ' + message);
    io.emit('message', message);
});
io.sockets.on('close', function() {
    console.log('Closing socketIO');
    io.emit('finish', 'Process completed.');
});
worker.set('socketio', io);


// catch 404 and forward to error handler
worker.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (worker.get('env') === 'development') {
  worker.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
worker.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = worker;
