const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/super/subscriptionsController');
router.get('/', ctrl.index);
router.post('/', ctrl.create);
router.put('/:id/confirm', ctrl.confirm);
module.exports = router;
