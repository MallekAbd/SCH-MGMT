const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/teacher/attendanceController');
router.get('/', ctrl.index);
router.get('/mark/:classId', ctrl.markForm);
router.post('/mark/:classId', ctrl.mark);
module.exports = router;
