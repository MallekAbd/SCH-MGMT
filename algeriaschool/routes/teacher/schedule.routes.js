const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/teacher/scheduleController');
router.get('/', ctrl.index);
module.exports = router;
