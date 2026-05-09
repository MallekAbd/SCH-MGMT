const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/super/plansController');
router.get('/', ctrl.index);
router.post('/', ctrl.store);
router.put('/:id', ctrl.update);
module.exports = router;
