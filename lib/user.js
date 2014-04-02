"use strict";

var user = {},
	async = require('async'),
	bcrypt = require('bcrypt'),
	nconf = require('nconf'),
	db = require('./database.js'),
	utils = require('./../public/js/utils');



user.create = function(userData, callback) {
	userData = userData || {};

	userData.username = userData.username.trim();
	userData.email = userData.email.trim();

	async.parallel([
		function(next) {
			next(!utils.isEmailValid(userData.email) ? 'Invalid Email!' : null);
		},
		function(next) {
			next((!utils.isUserNameValid(userData.username)) ? 'Invalid Username!' : null);
		},
		function(next) {
			if (userData.password) {
				next(!utils.isPasswordValid(userData.password) ? 'Invalid Password!' : null);
			} else {
				next();
			}
		},
		function(next) {
			user.exists(userData.username, function(err, exists) {
				if (err) {
					return next(err);
				}

				next(exists ? 'Username taken!' : null);
			});
		},
		function(next) {
			if (userData.email) {
				user.emailAvailable(userData.email, function(err, available) {
					if (err) {
						return next(err);
					}
					next(!available ? 'Email taken!' : null);
				});
			} else {
				next();
			}
		}
	], function(err, results) {
		if (err) {
			return callback(err);
		}

		db.incrObjectField('global', 'nextUid', function(err, uid) {
			if(err) {
				return callback(err);
			}

			var timestamp = Date.now();
			var password = userData.password;

			userData = {
				'uid': uid,
				'username': userData.username,
				'email': userData.email || '',
				'joindate': timestamp,
			};

			db.setObject('user:' + uid, userData, function(err) {
				if(err) {
					return callback(err);
				}
				db.setObjectField('username:uid', userData.username, uid);
				db.setObjectField('email:uid', userData.email, uid);
				db.incrObjectField('global', 'userCount');

				user.hashPassword(password, function(err, hash) {
					if(err) {
						return callback(err);
					}

					user.setUserField(uid, 'password', hash);
					callback(null, uid);
				});
			});
		});
	});
};


user.hashPassword = function(password, callback) {
	if (!password) {
		return callback(null, password);
	}

	bcrypt.genSalt(nconf.get('bcrypt_rounds'), function(err, salt) {
		if (err) {
			return callback(err);
		}
		bcrypt.hash(password, salt, callback);
	});
};

user.getUsernameByEmail = function(email, callback) {
	db.getObjectField('email:uid', email, function(err, uid) {
		if (err) {
			return callback(err);
		}
		user.getUserField(uid, 'username', callback);
	});
};

user.getUserField = function(uid, field, callback) {
	db.getObjectField('user:' + uid, field, callback);
};

user.getUserFields = function(uid, fields, callback) {
	db.getObjectFields('user:' + uid, fields, callback);
};

user.getMultipleUserFields = function(uids, fields, callback) {

	if (!Array.isArray(uids) || !uids.length) {
		return callback(null, []);
	}

	var keys = uids.map(function(uid) {
		return 'user:' + uid;
	});

	db.getObjectsFields(keys, fields, callback);
};

user.getUserData = function(uid, callback) {
	user.getUsersData([uid], function(err, users) {
		callback(err, users ? users[0] : null);
	});
};

user.setUserField = function(uid, field, value, callback) {
	db.setObjectField('user:' + uid, field, value, callback);
};

user.setUserFields = function(uid, data, callback) {
	db.setObject('user:' + uid, data, callback);
};

user.incrementUserFieldBy = function(uid, field, value, callback) {
	db.incrObjectFieldBy('user:' + uid, field, value, callback);
};

user.decrementUserFieldBy = function(uid, field, value, callback) {
	db.incrObjectFieldBy('user:' + uid, field, -value, callback);
};

user.exists = function(username, callback) {
	user.getUidByUsername(username, function(err, exists) {
		callback(err, !! exists);
	});
};

user.getUidByUsername = function(username, callback) {
	db.getObjectField('username:uid', username, callback);
};

user.emailAvailable = function(email, callback) {
	db.isObjectField('email:uid', email, function(err, exists) {
		callback(err, !exists);
	});
};

module.exports = user;