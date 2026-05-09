const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/messagesController');
router.get('/', ctrl.inbox);
router.get('/new', ctrl.compose);
router.post('/', ctrl.send);
router.get('/:id', ctrl.show);
module.exports = router;
