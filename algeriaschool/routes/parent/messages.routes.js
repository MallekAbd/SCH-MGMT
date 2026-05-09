const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/parent/messagesController');
router.get('/', ctrl.inbox);
router.post('/', ctrl.send);
router.get('/:id', ctrl.show);
module.exports = router;
