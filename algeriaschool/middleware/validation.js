const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  req.flash('errors', errors.array().map(e => e.msg));
  return res.redirect('back');
}

module.exports = { validate };
