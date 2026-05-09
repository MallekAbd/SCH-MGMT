const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/super/schoolsController');
router.get('/', ctrl.index);
router.get('/:id', ctrl.show);
router.post('/:id/lock', ctrl.lock);
router.post('/:id/unlock', ctrl.unlock);
module.exports = router;
