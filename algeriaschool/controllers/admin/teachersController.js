const Teacher = require('../../models/Teacher');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Class = require('../../models/Class');

exports.index = async (req, res) => {
  const teachers = await Teacher.find({ school: req.user.school })
    .populate('user', 'firstName lastName email phone avatar')
    .populate('courses', 'name')
    .sort({ createdAt: -1 }).lean();
  res.render('admin/teachers/index', { title: 'Enseignants', teachers, layout: 'admin' });
};

exports.create = async (req, res) => {
  const [courses, classes] = await Promise.all([
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/teachers/form', { title: 'Nouvel enseignant', teacher: null, courses, classes, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { firstName, lastName, email, phone, password, specialization, qualifications, contractType, salaryBase, joinDate, courses, classes } = req.body;
  const user = await User.create({
    firstName, lastName, email: email.toLowerCase(), password: password || 'Teacher@123',
    phone, role: 'teacher', school: req.user.school,
    avatar: req.file ? req.file.filename : null,
  });
  await Teacher.create({
    school: req.user.school, user: user._id,
    specialization, qualifications: qualifications ? qualifications.split(',').map(q => q.trim()) : [],
    contractType, salaryBase: salaryBase || 0,
    joinDate: joinDate || new Date(),
    courses: courses ? (Array.isArray(courses) ? courses : [courses]) : [],
    classes: classes ? (Array.isArray(classes) ? classes : [classes]) : [],
  });
  req.flash('success', 'Enseignant créé avec succès');
  res.redirect('/admin/teachers');
};

exports.show = async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.user.school })
    .populate('user', 'firstName lastName email phone avatar')
    .populate('courses', 'name code')
    .populate('classes', 'name level').lean();
  if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/teachers/show', { title: `${teacher.user.firstName} ${teacher.user.lastName}`, teacher, layout: 'admin' });
};

exports.edit = async (req, res) => {
  const [teacher, courses, classes] = await Promise.all([
    Teacher.findOne({ _id: req.params.id, school: req.user.school }).populate('user').lean(),
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/teachers/form', { title: 'Modifier enseignant', teacher, courses, classes, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { firstName, lastName, phone, specialization, qualifications, contractType, salaryBase, isActive, courses, classes } = req.body;
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.user.school });
  if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });
  await User.findByIdAndUpdate(teacher.user, {
    firstName, lastName, phone,
    ...(req.file ? { avatar: req.file.filename } : {}),
  });
  await Teacher.findByIdAndUpdate(teacher._id, {
    specialization,
    qualifications: qualifications ? qualifications.split(',').map(q => q.trim()) : [],
    contractType, salaryBase,
    isActive: isActive === 'on',
    courses: courses ? (Array.isArray(courses) ? courses : [courses]) : [],
    classes: classes ? (Array.isArray(classes) ? classes : [classes]) : [],
  });
  req.flash('success', 'Enseignant modifié avec succès');
  res.redirect('/admin/teachers');
};

exports.destroy = async (req, res) => {
  const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  if (teacher) await User.findByIdAndDelete(teacher.user);
  req.flash('success', 'Enseignant supprimé');
  res.redirect('/admin/teachers');
};
