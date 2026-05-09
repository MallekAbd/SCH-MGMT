const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/parent/attendanceController');
router.get('/', ctrl.index);
module.exports = router;
