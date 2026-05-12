const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const { sendMail } = require('../config/mailer');
const { createLogger } = require('../config/logger');
const logger = createLogger('auth');

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

function signAccess(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefresh(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET + '_refresh', { expiresIn: REFRESH_EXPIRES });
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh',
  });
}

exports.getLogin = async (req, res) => {
  if (req.cookies?.accessToken) {
    try {
      const decoded = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);
      const user = decoded ? await User.findById(decoded.id).select('_id isActive').lean() : null;
      if (user && user.isActive) return res.redirect('/dashboard');
    } catch (e) { /* expired or invalid */ }
    res.clearCookie('accessToken');
  }
  res.render('auth/login', { title: 'Connexion', redirect: req.query.redirect || '/dashboard' });
};

exports.postLogin = async (req, res) => {
  const { email, password, remember, redirect } = req.body;
  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      $or: [{ school: { $exists: false } }, { school: null }, { school: { $ne: null } }],
    }).populate('school');

    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', req.t('auth.invalid_credentials'));
      return res.redirect('/auth/login');
    }
    if (!user.isActive) {
      req.flash('error', req.t('auth.account_disabled'));
      return res.redirect('/auth/login');
    }

    if (user.school && user.school.isLocked) {
      req.flash('error', req.t('auth.school_locked'));
      return res.redirect('/auth/login');
    }

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    user.refreshTokens.push({ token: refreshToken });
    if (user.refreshTokens.length > 5) user.refreshTokens.shift();
    user.lastLogin = new Date();
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    const dest = redirect && redirect.startsWith('/') ? redirect : getDashboardPath(user.role);
    return res.redirect(dest);
  } catch (err) {
    logger.error('Login error', err);
    req.flash('error', 'Server error');
    return res.redirect('/auth/login');
  }
};

function getDashboardPath(role) {
  const map = {
    super_admin: '/super/dashboard',
    school_admin: '/admin/dashboard',
    sub_admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard',
    accountant: '/admin/billing',
  };
  return map[role] || '/auth/login';
}

exports.getDashboardPath = getDashboardPath;

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken && req.user) {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/auth/refresh' });
  req.flash('success', req.t('auth.logged_out'));
  res.redirect('/auth/login');
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.redirect('/auth/login');
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh');
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.some(t => t.token === refreshToken)) {
      return res.redirect('/auth/login');
    }
    const newAccess = signAccess(user._id);
    res.cookie('accessToken', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    const redirect = req.query.redirect || getDashboardPath(user.role);
    return res.redirect(redirect);
  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.redirect('/auth/login');
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Mot de passe oublié' });
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();
      const resetUrl = `${process.env.APP_URL}/auth/reset-password/${token}`;
      await sendMail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - MadrastekDz',
        html: `<p>Bonjour ${user.firstName},</p>
               <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
               <a href="${resetUrl}">${resetUrl}</a>
               <p>Ce lien expire dans 1 heure.</p>`,
      });
    }
    req.flash('success', req.t('auth.reset_email_sent'));
    res.redirect('/auth/forgot-password');
  } catch (err) {
    logger.error('Forgot password error', err);
    req.flash('error', 'Server error');
    res.redirect('/auth/forgot-password');
  }
};

exports.getResetPassword = async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash('error', req.t('auth.reset_invalid'));
    return res.redirect('/auth/forgot-password');
  }
  res.render('auth/reset-password', { title: 'Nouveau mot de passe', token: req.params.token });
};

exports.postResetPassword = async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash('error', req.t('auth.reset_invalid'));
    return res.redirect('/auth/forgot-password');
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  req.flash('success', req.t('auth.password_changed'));
  res.redirect('/auth/login');
};

exports.getRegister = async (req, res) => {
  const plans = await Plan.find({ isActive: true });
  res.render('auth/register', { title: 'Créer un compte école', plans });
};

exports.postRegister = async (req, res) => {
  const { firstName, lastName, email, password, schoolName, schoolType, planId } = req.body;
  try {
    const existing = await User.findOne({ email: email.toLowerCase(), school: null });
    if (existing) {
      req.flash('error', req.t('auth.email_taken'));
      return res.redirect('/auth/register');
    }

    const plan = await Plan.findById(planId) || await Plan.findOne({ code: 'BASE' });

    const school = await School.create({
      name: schoolName,
      type: schoolType || 'private',
    });

    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const subscription = await Subscription.create({
      school: school._id,
      plan: plan._id,
      period: 'monthly',
      amount: 0,
      status: 'trial',
      startDate: new Date(),
      endDate: trialEnd,
    });

    school.subscription = subscription._id;
    school.trialEndsAt = trialEnd;
    await school.save();

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'school_admin',
      school: school._id,
    });

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    await sendMail({
      to: user.email,
      subject: 'Bienvenue sur MadrastekDz !',
      html: `<h2>Bienvenue ${user.firstName} !</h2>
             <p>Votre école <strong>${school.name}</strong> a été créée avec succès.</p>
             <p>Vous bénéficiez de 30 jours d'essai gratuit.</p>
             <a href="${process.env.APP_URL}/admin/dashboard">Accéder au tableau de bord</a>`,
    });

    return res.redirect('/admin/dashboard');
  } catch (err) {
    logger.error('Register error', err);
    req.flash('error', err.message || 'Server error');
    return res.redirect('/auth/register');
  }
};
