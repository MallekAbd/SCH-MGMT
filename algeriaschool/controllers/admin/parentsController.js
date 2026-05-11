const Parent = require('../../models/Parent');
const User = require('../../models/User');
const Student = require('../../models/Student');
const { sendMail } = require('../../config/mailer');

exports.index = async (req, res) => {
  const parents = await Parent.find({ school: req.user.school })
    .populate('user', 'firstName lastName email phone')
    .populate('students', 'firstName lastName')
    .sort({ createdAt: -1 }).lean();
  res.render('admin/parents/index', { title: 'Parents', parents, layout: 'admin' });
};

exports.create = async (req, res) => {
  const students = await Student.find({ school: req.user.school, status: 'active' }).lean();
  res.render('admin/parents/form', { title: 'Nouveau parent', parent: null, students, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { firstName, lastName, email, phone, relationship, profession, employer, alternatePhone, students } = req.body;
  const password = 'Parent@' + Math.random().toString(36).slice(-6).toUpperCase();
  const user = await User.create({
    firstName, lastName, email: email.toLowerCase(),
    password, phone, role: 'parent', school: req.user.school,
  });
  const studentIds = students ? (Array.isArray(students) ? students : [students]) : [];
  await Parent.create({
    school: req.user.school, user: user._id,
    relationship, profession, employer, alternatePhone,
    students: studentIds,
  });
  if (studentIds.length) {
    await Student.updateMany({ _id: { $in: studentIds } }, { $addToSet: { parents: user._id } });
  }
  await sendMail({
    to: email,
    subject: 'Vos identifiants MadrastekDz',
    html: `<h2>Bienvenue ${firstName} ${lastName}</h2>
           <p>Email: <strong>${email}</strong></p>
           <p>Mot de passe: <strong>${password}</strong></p>
           <p>Veuillez changer votre mot de passe à la première connexion.</p>`,
  });
  req.flash('success', 'Parent créé et identifiants envoyés par email');
  res.redirect('/admin/parents');
};

exports.show = async (req, res) => {
  const parent = await Parent.findOne({ _id: req.params.id, school: req.user.school })
    .populate('user', 'firstName lastName email phone')
    .populate('students').lean();
  if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/parents/show', { title: `${parent.user.firstName} ${parent.user.lastName}`, parent, layout: 'admin' });
};

exports.edit = async (req, res) => {
  const [parent, students] = await Promise.all([
    Parent.findOne({ _id: req.params.id, school: req.user.school }).populate('user').lean(),
    Student.find({ school: req.user.school, status: 'active' }).lean(),
  ]);
  if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/parents/form', { title: 'Modifier parent', parent, students, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { firstName, lastName, phone, relationship, profession, employer, alternatePhone, students } = req.body;
  const parent = await Parent.findOne({ _id: req.params.id, school: req.user.school });
  if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });
  await User.findByIdAndUpdate(parent.user, { firstName, lastName, phone });
  const studentIds = students ? (Array.isArray(students) ? students : [students]) : [];
  await Parent.findByIdAndUpdate(parent._id, { relationship, profession, employer, alternatePhone, students: studentIds });
  req.flash('success', 'Parent modifié avec succès');
  res.redirect('/admin/parents');
};

exports.destroy = async (req, res) => {
  const parent = await Parent.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  if (parent) await User.findByIdAndDelete(parent.user);
  req.flash('success', 'Parent supprimé');
  res.redirect('/admin/parents');
};
