const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/parent/invoicesController');
router.get('/', ctrl.index);
module.exports = router;
