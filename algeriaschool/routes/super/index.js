const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
router.use(authenticate, authorize('super_admin'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/schools', require('./schools.routes'));
router.use('/subscriptions', require('./subscriptions.routes'));
router.use('/plans', require('./plans.routes'));
module.exports = router;
