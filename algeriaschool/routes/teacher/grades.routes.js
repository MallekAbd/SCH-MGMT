const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/teacher/gradesController');
router.get('/', ctrl.index);
router.get('/enter/:examId', ctrl.enterGrades);
router.post('/enter/:examId', ctrl.saveGrades);
module.exports = router;
