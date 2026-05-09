const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { tenantMiddleware } = require('../../middleware/tenant');

const adminRoles = ['school_admin', 'sub_admin', 'accountant'];
router.use(authenticate, authorize('super_admin', 'school_admin', 'sub_admin', 'accountant'), tenantMiddleware);

router.use('/dashboard', require('./dashboard.routes'));
router.use('/sectors', require('./sectors.routes'));
router.use('/courses', require('./courses.routes'));
router.use('/classes', require('./classes.routes'));
router.use('/students', require('./students.routes'));
router.use('/teachers', require('./teachers.routes'));
router.use('/parents', require('./parents.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/grades', require('./grades.routes'));
router.use('/library', require('./library.routes'));
router.use('/billing', require('./billing.routes'));
router.use('/expenses', require('./expenses.routes'));
router.use('/access', require('./access.routes'));
router.use('/trainings', require('./trainings.routes'));
router.use('/admissions', require('./admissions.routes'));
router.use('/announcements', require('./announcements.routes'));
router.use('/messages', require('./messages.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
