const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/teacher/libraryController');
const { upload } = require('../../config/multer');
router.get('/', ctrl.index);
router.get('/new', ctrl.create);
router.post('/', upload('library').single('file'), ctrl.store);
module.exports = router;
