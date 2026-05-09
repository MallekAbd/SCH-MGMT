const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/admissionsController');
router.get('/', ctrl.index);
router.get('/:id', ctrl.show);
router.post('/:id/approve', ctrl.approve);
router.post('/:id/reject', ctrl.reject);
router.post('/:id/enroll', ctrl.convertToStudent);
module.exports = router;
