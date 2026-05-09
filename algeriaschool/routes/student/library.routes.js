const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/student/libraryController');
router.get('/', ctrl.index);
router.get('/:id/download', ctrl.download);
module.exports = router;
