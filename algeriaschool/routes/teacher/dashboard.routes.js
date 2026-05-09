const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/teacher/dashboardController');
router.get('/', ctrl.index);
module.exports = router;
