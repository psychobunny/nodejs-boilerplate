"use strict";

var winston = require('winston'),
	nconf = require('nconf'),
	express = require('express'),
	express_namespace = require('express-namespace'),
	app = express(),
	server = require('http').createServer(app);




module.exports = function () {
	var middleware = require('./middleware')(app);
	require('./routes')(app, middleware);


	server.on("error", function(err){
		if (err.code === 'EADDRINUSE') {
			winston.error('NodeBB address in use, exiting...');
			process.exit(1);
		} else {
			throw err;
		}
	});

	server.listen(nconf.get('port'), nconf.get('bind_address'), function() {
		winston.info('NodeBB Ready');
	});
};