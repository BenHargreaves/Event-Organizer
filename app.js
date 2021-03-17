var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var schedulingRouter = require('./routes/api/scheduling');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Frontend Routes -- NOT IMPLEMENTED
app.use('/', indexRouter);

//API Routes
app.use('/api', schedulingRouter);

module.exports = app;
