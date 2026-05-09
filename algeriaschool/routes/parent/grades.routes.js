const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/parent/gradesController');
router.get('/', ctrl.index);
module.exports = router;
