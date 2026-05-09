const School = require('../models/School');

async function tenantMiddleware(req, res, next) {
  if (!req.user || req.user.role === 'super_admin') return next();
  if (!req.user.school) {
    return res.status(403).render('errors/403', { title: 'No school assigned' });
  }
  try {
    const school = await School.findById(req.user.school).lean();
    if (!school) return res.status(404).render('errors/404', { title: 'School not found' });
    if (school.isLocked) {
      return res.render('errors/locked', { title: 'Account Locked', school });
    }
    req.school = school;
    res.locals.school = school;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { tenantMiddleware };
