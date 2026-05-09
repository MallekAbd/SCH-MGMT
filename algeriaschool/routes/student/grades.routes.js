const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/student/gradesController');
router.get('/', ctrl.index);
module.exports = router;
