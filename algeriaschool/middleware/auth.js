const jwt = require('jsonwebtoken');
const User = require('../models/User');
const School = require('../models/School');
const Subscription = require('../models/Subscription');

async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshTokens').populate('customRole');
    if (!user || !user.isActive) {
      return res.redirect('/auth/login');
    }
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.redirect('/auth/refresh?redirect=' + encodeURIComponent(req.originalUrl));
    }
    return res.redirect('/auth/login');
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/auth/login');
    if (roles.includes(req.user.role)) return next();
    return res.status(403).render('errors/403', { title: 'Access Denied' });
  };
}

module.exports = { authenticate, authorize };
