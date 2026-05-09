const Class = require('../../models/Class');
const Course = require('../../models/Course');
const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const Schedule = require('../../models/Schedule');

exports.index = async (req, res) => {
  const classes = await Class.find({ school: req.user.school })
    .populate('homeTeacher', 'user').sort({ name: 1 }).lean();
  res.render('admin/classes/index', { title: 'Classes', classes, layout: 'admin' });
};

exports.create = async (req, res) => {
  const [courses, teachers] = await Promise.all([
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Teacher.find({ school: req.user.school, isActive: true }).populate('user', 'firstName lastName').lean(),
  ]);
  res.render('admin/classes/form', { title: 'Nouvelle classe', cls: null, courses, teachers, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { name, level, academicYear, capacity, room, homeTeacher, courses } = req.body;
  await Class.create({
    school: req.user.school,
    name, level, academicYear, capacity, room,
    homeTeacher: homeTeacher || null,
    courses: courses ? (Array.isArray(courses) ? courses : [courses]) : [],
  });
  req.flash('success', 'Classe créée avec succès');
  res.redirect('/admin/classes');
};

exports.show = async (req, res) => {
  const cls = await Class.findOne({ _id: req.params.id, school: req.user.school })
    .populate('courses', 'name code')
    .populate({ path: 'homeTeacher', populate: { path: 'user', select: 'firstName lastName' } })
    .lean();
  if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });
  const students = await Student.find({ school: req.user.school, currentClass: cls._id }).lean();
  const schedule = await Schedule.find({ school: req.user.school, class: cls._id })
    .populate('course', 'name').populate({ path: 'teacher', populate: { path: 'user', select: 'firstName lastName' } }).lean();
  res.render('admin/classes/show', { title: cls.name, cls, students, schedule, layout: 'admin' });
};

exports.edit = async (req, res) => {
  const [cls, courses, teachers] = await Promise.all([
    Class.findOne({ _id: req.params.id, school: req.user.school }).lean(),
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Teacher.find({ school: req.user.school, isActive: true }).populate('user', 'firstName lastName').lean(),
  ]);
  if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/classes/form', { title: 'Modifier classe', cls, courses, teachers, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { name, level, academicYear, capacity, room, homeTeacher, courses, isActive } = req.body;
  await Class.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    {
      name, level, academicYear, capacity, room,
      homeTeacher: homeTeacher || null,
      courses: courses ? (Array.isArray(courses) ? courses : [courses]) : [],
      isActive: isActive === 'on',
    }
  );
  req.flash('success', 'Classe modifiée avec succès');
  res.redirect('/admin/classes');
};

exports.destroy = async (req, res) => {
  await Class.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Classe supprimée');
  res.redirect('/admin/classes');
};
