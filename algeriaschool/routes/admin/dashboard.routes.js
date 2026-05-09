const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/dashboardController');
router.get('/', ctrl.index);
module.exports = router;
