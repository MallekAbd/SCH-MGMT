const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/student/invoicesController');
router.get('/', ctrl.index);
module.exports = router;
