const Course = require('../../models/Course');
const Sector = require('../../models/Sector');

exports.index = async (req, res) => {
  const courses = await Course.find({ school: req.user.school }).populate('sector', 'name').sort({ name: 1 }).lean();
  res.render('admin/courses/index', { title: 'Matières', courses, layout: 'admin' });
};

exports.create = async (req, res) => {
  const sectors = await Sector.find({ school: req.user.school, isActive: true }).lean();
  res.render('admin/courses/form', { title: 'Nouvelle matière', course: null, sectors, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { code, name, nameAr, description, sector, credits, hoursPerWeek, level } = req.body;
  await Course.create({ school: req.user.school, code, name, nameAr, description, sector: sector || null, credits, hoursPerWeek, level });
  req.flash('success', 'Matière créée avec succès');
  res.redirect('/admin/courses');
};

exports.edit = async (req, res) => {
  const [course, sectors] = await Promise.all([
    Course.findOne({ _id: req.params.id, school: req.user.school }).lean(),
    Sector.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  if (!course) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/courses/form', { title: 'Modifier matière', course, sectors, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { code, name, nameAr, description, sector, credits, hoursPerWeek, level, isActive } = req.body;
  await Course.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { code, name, nameAr, description, sector: sector || null, credits, hoursPerWeek, level, isActive: isActive === 'on' }
  );
  req.flash('success', 'Matière modifiée avec succès');
  res.redirect('/admin/courses');
};

exports.destroy = async (req, res) => {
  await Course.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Matière supprimée');
  res.redirect('/admin/courses');
};
