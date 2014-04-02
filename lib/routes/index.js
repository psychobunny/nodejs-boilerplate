"use strict";

var user = require('./../user'),
	passport = require('passport'),
	nconf = require('nconf'),
	utils = require('./../../public/js/utils');

function renderIndex(req, res, next) {
	res.render('index', {});
}

function renderLogin(req, res, next) {
	res.render('login', {
		csrf: res.locals.csrf_token
	});
}

function render403(req, res, next) {
	res.render('403', {
		csrf: res.locals.csrf_token
	});
}

function renderRegister(req, res, next) {
	res.render('register', {
		csrf: res.locals.csrf_token
	});
}

function logout(req, res) {
	if (req.user && parseInt(req.user.uid, 10) > 0) {
		req.logout();
	}

	res.redirect('/');
}

function login(req, res, next) {
	passport.authenticate('local', function(err, userData, info) {
		if (err) {
			return next(err);
		}
		
		if (!userData) {
			return res.json({err: 'Invalid password or user combination'});
		}

		// Alter user cookie depending on passed-in option
		if (req.body.remember === 'true') {
			var duration = 1000*60*60*24*parseInt(nconf.get('loginDays') || 14, 10);
			req.session.cookie.maxAge = duration;
			req.session.cookie.expires = new Date(Date.now() + duration);
		} else {
			req.session.cookie.maxAge = false;
			req.session.cookie.expires = false;
		}

		req.login({
			uid: userData.uid
		}, function() {
			res.json(200, info);
		});
	})(req, res, next);
}

function register(req, res) {
	var userData = {
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		ip: req.ip
	};

	user.create(userData, function(err, uid) {
		if (err || !uid) {
			return res.json({err: err});
		}

		req.login({
			uid: uid
		}, function() {
			res.json({
				err: null,
				redirect: req.body.referrer ? req.body.referrer : nconf.get('relative_path') + '/dashboard'
			});
		});
	});
}

module.exports = function(app, middleware) {
	app.get('/', middleware.renderPage, renderIndex);
	app.get('/403', middleware.renderPage, render403);
	app.get('/login', middleware.renderPage, renderLogin);
	app.get('/register', middleware.renderPage, renderRegister);
	app.get('/dashboard', middleware.authenticate, middleware.renderPage, renderIndex);

	app.post('/logout', logout);
	app.post('/register', register);
	app.post('/login', function(req, res, next) {
		if (req.body.username && utils.isEmailValid(req.body.username)) {
			user.getUsernameByEmail(req.body.username, function(err, username) {
				if (err) {
					return next(err);
				}
				req.body.username = username ? username : req.body.username;
				login(req, res, next);
			});
		} else {
			login(req, res, next);
		}
	});
};