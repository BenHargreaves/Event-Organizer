var express = require('express');
var path = require('path');

var indexRouter = require('./routes/index');
var schedulingRouter = require('./routes/api/scheduling');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Frontend Routes -- NOT IMPLEMENTED
app.use('/', indexRouter);

//API Routes
app.use('/api', schedulingRouter);

module.exports = app;
