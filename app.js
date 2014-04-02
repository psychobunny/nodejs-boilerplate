"use strict";

var nconf = require('nconf'),
	path = require('path');


nconf.argv().env();

nconf.file({
	file: __dirname + '/config.json'
});

nconf.set('views_dir', path.join(__dirname, 'templates'));

require('./lib/database').init(function(err) {
	require('./lib/server')();
});