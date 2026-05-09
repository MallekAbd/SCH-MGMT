const Training = require('../../models/Training');
const Teacher = require('../../models/Teacher');
const User = require('../../models/User');
const { generateCertificate } = require('../../services/pdfService');

exports.index = async (req, res) => {
  const trainings = await Training.find({ school: req.user.school }).sort({ createdAt: -1 }).lean();
  res.render('admin/trainings/index', { title: 'Formations', trainings, layout: 'admin' });
};

exports.create = async (req, res) => {
  const teachers = await Teacher.find({ school: req.user.school, isActive: true }).populate('user', 'firstName lastName').lean();
  res.render('admin/trainings/form', { title: 'Nouvelle formation', training: null, teachers, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { name, description, duration, instructor, fee, maxParticipants } = req.body;
  await Training.create({ school: req.user.school, name, description, duration, instructor: instructor || null, fee: fee || 0, maxParticipants: maxParticipants || 30 });
  req.flash('success', 'Formation créée');
  res.redirect('/admin/trainings');
};

exports.show = async (req, res) => {
  const training = await Training.findOne({ _id: req.params.id, school: req.user.school })
    .populate({ path: 'instructor', populate: { path: 'user', select: 'firstName lastName' } })
    .populate('enrollees.user', 'firstName lastName email').lean();
  if (!training) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/trainings/show', { title: training.name, training, layout: 'admin' });
};

exports.edit = async (req, res) => {
  const [training, teachers] = await Promise.all([
    Training.findOne({ _id: req.params.id, school: req.user.school }).lean(),
    Teacher.find({ school: req.user.school, isActive: true }).populate('user', 'firstName lastName').lean(),
  ]);
  if (!training) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/trainings/form', { title: 'Modifier formation', training, teachers, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { name, description, duration, instructor, fee, maxParticipants, isActive } = req.body;
  await Training.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { name, description, duration, instructor: instructor || null, fee, maxParticipants, isActive: isActive === 'on' }
  );
  req.flash('success', 'Formation modifiée');
  res.redirect('/admin/trainings');
};

exports.destroy = async (req, res) => {
  await Training.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Formation supprimée');
  res.redirect('/admin/trainings');
};

exports.enroll = async (req, res) => {
  const { userId } = req.body;
  await Training.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { $push: { enrollees: { user: userId, enrolledAt: new Date() } } }
  );
  req.flash('success', 'Participant inscrit');
  res.redirect(`/admin/trainings/${req.params.id}`);
};

exports.certificate = async (req, res) => {
  const training = await Training.findOne({ _id: req.params.id, school: req.user.school }).lean();
  const user = await User.findById(req.params.userId).lean();
  if (!training || !user) return res.status(404).render('errors/404', { title: 'Not Found' });
  const pdfBuffer = await generateCertificate(user, training, req.school);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${user._id}.pdf"`);
  res.send(pdfBuffer);
};
