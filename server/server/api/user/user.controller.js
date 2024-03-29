'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var stripe = require('stripe')(config.stripe.apiKey);
var concur = require('concur-platform');

var validationError = function (res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if (err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

exports.concurReports = function (req, res) {
  if (!req.user) return res.status(401).send('Unauthorized');
  if (!req.user.concur.accessToken) return res.status(200).json([]);

  concur.reports.get({
    oauthToken: req.user.concur.accessToken
  }).then(function (data) {
    console.log(data);
    res.status(200).json(data);
  }).fail(function (error) {
    handleError(res, error);
  });
};

exports.expenseGroups = function (req, res) {
  if (!req.user) return res.status(401).send('Unauthorized');
  if (!req.user.concur.accessToken) return res.status(200).json([]);

  concur.expenseGroupConfigurations.get({
    oauthToken: req.user.concur.accessToken
  }).then(function (data) {
    console.log(data);
    res.status(200).json(data);
  }).fail(function (error) {
    handleError(res, error);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function (err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
    res.json({token: token});

    stripe.customers.create({
      description: 'Customer for ' + user.email,
    }, function (err, customer) {
      if (err) return console.error(err);

      user.stripe.customerId = customer.id;

      user.save(function (err, user) {
        if (err) return console.error(err);
      });
    });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.findByIdAndRemove(req.params.id, function (err, user) {
    if (err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function (err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function (err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};


exports.addCard = function (req, res, next) {
  stripe.customers.createSource(req.user.stripe.customerId, {
    source: req.body.tokenId
  }, function (err, card) {
    if (err) return next(err);

    var cardData = {
      name: req.body.name,
      stripe: card
    };

    User.update({
        '_id': req.user._id
      }, {
        '$push': {
          'stripe.cards': cardData
        }
      }, function (err) {
        if (err) return next(err);

        res.status(200).send('OK');
      }
    );
  });
};

exports.removeCard = function (req, res, next) {
  User.findById(req.user._id, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');

    var cards = user.stripe.cards;
    var index = -1;

    for (var i = 0; i < cards.length; i++) {
      if (cards[i].stripe.id === req.body.cardId) {
        index = i;
      }
    }

    if (index === -1) return res.status(404).send('Card not found');

    user.stripe.cards.splice(index, 1);

    user.save(function (err) {
      if (err) return next(err);
      res.status(200).send('OK')
    });
  });
};

function handleError(res, err) {
  console.log(err);
  return res.status(500).json(err.message);
}
