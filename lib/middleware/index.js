"use strict";
var express = require('express'),
	winston = require('winston'),
	nconf = require('nconf'),
	path = require('path'),
	async = require('async'),
	passport = require('passport'),
	passportLocal = require('passport-local').Strategy,
	templates = require('templates.js'),
	bcrypt = require('bcrypt'),
	user = require('./../user'),
	db = require('./../database'),
	utils = require('./../../public/js/utils');

var middleware = {},
	app;


middleware.authenticate = function(req, res, next) {
	if (req.user && req.user.uid) {
		next();
	} else {
		res.redirect('/403');
	}
};

middleware.processRender = function(req, res, next) {
	// res.render post-processing, modified from here: https://gist.github.com/mrlannigan/5051687
	var render = res.render;
	res.render = function(template, options, fn) {
		var self = this,
			options = options || {},
			req = this.req,
			app = req.app,
			defaultFn = function(err, str){
				if (err) {
					return req.next(err);
				}

				self.send(str);
			};

		if ('function' === typeof options) {
			fn = options, options = {};
		}

		if ('function' !== typeof fn) {
			fn = defaultFn;
		}

		if (res.locals.isAPI) {
			return res.json(options);
		}

		render.call(self, template, options, function(err, str) {
			if (res.locals.footer) {
				str = str + res.locals.footer;
			}

			if (res.locals.header) {
				str = res.locals.header + str;
			}

			fn(err, str);
		});
	};

	next();
};


middleware.renderPage = function(req, res, next) {
	var uid = req.user ? req.user.uid : 0;

	async.parallel([
		function(next) {
			app.render('header', {uid: uid, csrf: res.locals.csrf_token}, function(err, template) {
				res.locals.header = template;
				next(err);
			});
		},
		function(next) {
			app.render('footer', {uid: uid, csrf: res.locals.csrf_token}, function(err, template) {
				res.locals.footer = template;
				next(err);
			});
		}
	], function(err) {
		next(err);
	});
};


module.exports = function(server, data) {
	app = server;

	app.configure(function() {
		app.engine('tpl', templates.__express);
		app.set('view engine', 'tpl');
		app.set('views', nconf.get('views_dir'));

		app.use(express.compress());

		app.use(require('less-middleware')({
			src: path.join(__dirname, '../../', 'public'),
			prefix: nconf.get('relative_path'),
			yuicompress: app.enabled('minification') ? true : false
		}));

		app.use(express.bodyParser());
		app.use(express.cookieParser());

		app.use(express.session({
			store: db.sessionStore,
			secret: nconf.get('secret'),
			key: 'express.sid',
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * parseInt(nconf.get('loginDays') || 14, 10)
			}
		}));

		app.use(passport.initialize());
		app.use(passport.session());

		passport.use(new passportLocal(function(username, password, next) {
			if (!username || !password) {
				return next(new Error('invalid-user'));
			}

			user.getUidByUsername(username, function(err, uid) {
				if (err) {
					return next(err);
				}

				if(!uid) {
					// Even if a user doesn't exist, compare passwords anyway, so we don't immediately return
					return next(null, false, 'user doesn\'t exist');
				}

				user.getUserFields(uid, ['password'], function(err, userData) {
					if (err) {
						return next(err);
					}

					if (!userData || !userData.password) {
						return next(new Error('invalid userdata or password'));
					}

					bcrypt.compare(password, userData.password, function(err, res) {
						if (err) {
							return next(new Error('bcrypt compare error'));
						}

						if (!res) {
							return next(null, false, 'invalid-password');
						}

						next(null, {
							uid: uid
						}, 'Authentication successful');
					});
				});
			});
		}));

		passport.serializeUser(function(user, done) {
			done(null, user.uid);
		});

		passport.deserializeUser(function(uid, done) {
			done(null, {
				uid: uid
			});
		});

		app.use(express.csrf()); // todo, make this a conditional middleware

		app.use(function (req, res, next) {
			res.locals.csrf_token = req.session._csrf;
			res.setHeader('X-Frame-Options', 'SAMEORIGIN');
			res.setHeader('X-Powered-By', 'NodeBB');
			next();
		});

		app.use(middleware.processRender);
		app.use(nconf.get('relative_path'), app.router);

		app.use(nconf.get('relative_path'), express.static(path.join(__dirname, '../../', 'public'), {
			maxAge: app.enabled('cache') ? 5184000000 : 0
		}));
		app.use(path.join(nconf.get('relative_path'), '/fonts'), express.static(path.join(__dirname, '../../', 'themes/Flat-UI/fonts')));
		app.use(path.join(nconf.get('relative_path'), '/images'), express.static(path.join(__dirname, '../../', 'themes/Flat-UI/images')));
	});

	return middleware;
};