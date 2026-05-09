const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/attendanceController');
router.get('/', ctrl.index);
router.get('/mark/:classId', ctrl.markForm);
router.post('/mark/:classId', ctrl.mark);
router.get('/report', ctrl.report);
module.exports = router;
