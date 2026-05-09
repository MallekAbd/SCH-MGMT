const Role = require('../../models/Role');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');

const MODULES = ['sectors', 'courses', 'classes', 'students', 'teachers', 'parents', 'attendance', 'grades', 'library', 'billing', 'expenses', 'access', 'trainings', 'admissions', 'announcements', 'messages'];
const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];

exports.index = async (req, res) => {
  const roles = await Role.find({ school: req.user.school }).lean();
  const users = await User.find({ school: req.user.school }).lean();
  res.render('admin/access/index', { title: 'Gestion des accès', roles, users, modules: MODULES, actions: ACTIONS, layout: 'admin' });
};

exports.createRole = (req, res) => {
  res.render('admin/access/role-form', { title: 'Nouveau rôle', role: null, modules: MODULES, actions: ACTIONS, layout: 'admin' });
};

exports.storeRole = async (req, res) => {
  const { name, permissions: rawPerms } = req.body;
  const permissions = MODULES.map(mod => ({
    module: mod,
    actions: ACTIONS.filter(a => rawPerms?.[mod]?.[a] === 'on'),
  }));
  await Role.create({ name, slug: name.toLowerCase().replace(/\s+/g, '_'), school: req.user.school, permissions });
  req.flash('success', 'Rôle créé');
  res.redirect('/admin/access');
};

exports.editRole = async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!role) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/access/role-form', { title: 'Modifier rôle', role, modules: MODULES, actions: ACTIONS, layout: 'admin' });
};

exports.updateRole = async (req, res) => {
  const { name, permissions: rawPerms } = req.body;
  const permissions = MODULES.map(mod => ({
    module: mod,
    actions: ACTIONS.filter(a => rawPerms?.[mod]?.[a] === 'on'),
  }));
  await Role.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, { name, permissions });
  req.flash('success', 'Rôle modifié');
  res.redirect('/admin/access');
};

exports.destroyRole = async (req, res) => {
  await Role.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Rôle supprimé');
  res.redirect('/admin/access');
};

exports.auditLogs = async (req, res) => {
  const logs = await AuditLog.find({ school: req.user.school })
    .populate('user', 'firstName lastName email role')
    .sort({ createdAt: -1 }).limit(100).lean();
  res.render('admin/access/audit-logs', { title: 'Journal d\'audit', logs, layout: 'admin' });
};
