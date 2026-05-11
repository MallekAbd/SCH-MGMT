const Application = require('../../models/Application');
const Student = require('../../models/Student');
const User = require('../../models/User');
const Parent = require('../../models/Parent');
const { sendMail } = require('../../config/mailer');
const { v4: uuidv4 } = require('uuid');

exports.index = async (req, res) => {
  const { status } = req.query;
  const filter = { school: req.user.school };
  if (status) filter.status = status;
  const applications = await Application.find(filter).sort({ createdAt: -1 }).lean();
  res.render('admin/admissions/index', { title: 'Admissions', applications, status: status || '', layout: 'admin' });
};

exports.show = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!application) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/admissions/show', { title: `${application.firstName} ${application.lastName}`, application, layout: 'admin' });
};

exports.approve = async (req, res) => {
  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), notes: req.body.notes }
  );
  if (application?.parentEmail) {
    await sendMail({
      to: application.parentEmail,
      subject: 'Demande d\'admission approuvée',
      html: `<h2>Félicitations !</h2><p>La demande d'admission de <strong>${application.firstName} ${application.lastName}</strong> a été approuvée.</p>`,
    });
  }
  req.flash('success', 'Demande approuvée');
  res.redirect(`/admin/admissions/${req.params.id}`);
};

exports.reject = async (req, res) => {
  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), notes: req.body.notes }
  );
  if (application?.parentEmail) {
    await sendMail({
      to: application.parentEmail,
      subject: 'Décision concernant votre demande d\'admission',
      html: `<p>Nous regrettons de vous informer que la demande d'admission de <strong>${application.firstName} ${application.lastName}</strong> n'a pas été retenue.</p>`,
    });
  }
  req.flash('success', 'Demande rejetée');
  res.redirect(`/admin/admissions/${req.params.id}`);
};

exports.convertToStudent = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!application || application.status !== 'approved') {
    req.flash('error', 'Application doit être approuvée avant conversion');
    return res.redirect(`/admin/admissions/${req.params.id}`);
  }
  const studentId = 'STU-' + uuidv4().split('-')[0].toUpperCase();
  const student = await Student.create({
    school: req.user.school,
    firstName: application.firstName,
    lastName: application.lastName,
    dateOfBirth: application.dateOfBirth,
    gender: application.gender,
    wilaya: application.wilaya,
    address: application.address,
    studentId,
    admissionDate: new Date(),
  });
  const parentPassword = 'Parent@' + Math.random().toString(36).slice(-6).toUpperCase();
  const parentUser = await User.create({
    firstName: application.parentName.split(' ')[0] || application.parentName,
    lastName: application.parentName.split(' ').slice(1).join(' ') || '',
    email: application.parentEmail || `parent-${student._id}@demo.school`,
    password: parentPassword,
    phone: application.parentPhone,
    role: 'parent',
    school: req.user.school,
  });
  await Parent.create({
    school: req.user.school,
    user: parentUser._id,
    relationship: application.parentRelationship || 'father',
    students: [student._id],
  });
  student.parents = [parentUser._id];
  await student.save();
  await Application.findByIdAndUpdate(application._id, { status: 'enrolled', convertedStudent: student._id });
  if (application.parentEmail) {
    await sendMail({
      to: application.parentEmail,
      subject: 'Inscription confirmée - MadrastekDz',
      html: `<h2>Inscription confirmée</h2>
             <p>${application.firstName} est maintenant inscrit(e).</p>
             <p>Vos identifiants parent: <strong>${application.parentEmail}</strong> / <strong>${parentPassword}</strong></p>`,
    });
  }
  req.flash('success', 'Élève créé avec succès');
  res.redirect(`/admin/students/${student._id}`);
};
