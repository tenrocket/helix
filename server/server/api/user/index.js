'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

router.post('/cards', auth.isAuthenticated(), controller.addCard);
router.post('/cards/delete', auth.isAuthenticated(), controller.removeCard);

router.get('/concur/reports', auth.isAuthenticated(), controller.concurReports);
router.get('/concur/expenseGroups', auth.isAuthenticated(), controller.expenseGroups);

module.exports = router;
