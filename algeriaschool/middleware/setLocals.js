module.exports = function setLocals(req, res, next) {
  res.locals.user = req.user || null;
  res.locals.school = req.school || null;
  res.locals.flashSuccess = req.flash ? req.flash('success') : [];
  res.locals.flashError = req.flash ? req.flash('error') : [];
  res.locals.flashErrors = req.flash ? req.flash('errors') : [];
  res.locals.currentPath = req.path;
  res.locals.t = req.t || ((k) => k);
  res.locals.lang = req.language || process.env.DEFAULT_LANG || 'fr';
  res.locals.isRTL = res.locals.lang === 'ar';
  next();
};
