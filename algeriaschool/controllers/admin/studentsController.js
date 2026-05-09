const Student = require('../../models/Student');
const User = require('../../models/User');
const Class = require('../../models/Class');
const Parent = require('../../models/Parent');
const Enrollment = require('../../models/Enrollment');
const { generateStudentIdCard } = require('../../services/pdfService');
const { v4: uuidv4 } = require('uuid');

exports.index = async (req, res) => {
  const { search, classId, status } = req.query;
  const filter = { school: req.user.school };
  if (status) filter.status = status;
  if (classId) filter.currentClass = classId;
  if (search) filter.$or = [
    { firstName: new RegExp(search, 'i') },
    { lastName: new RegExp(search, 'i') },
    { studentId: new RegExp(search, 'i') },
  ];
  const [students, classes] = await Promise.all([
    Student.find(filter).populate('currentClass', 'name').sort({ lastName: 1 }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/students/index', { title: 'Élèves', students, classes, search: search || '', status: status || '', classId: classId || '', layout: 'admin' });
};

exports.create = async (req, res) => {
  const classes = await Class.find({ school: req.user.school, isActive: true }).lean();
  res.render('admin/students/form', { title: 'Nouvel élève', student: null, classes, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { firstName, lastName, firstNameAr, lastNameAr, dateOfBirth, gender, address, wilaya, nationalId, medicalNotes, currentClass, academicYear } = req.body;
  const photo = req.file ? req.file.filename : null;
  const studentId = 'STU-' + uuidv4().split('-')[0].toUpperCase();
  const student = await Student.create({
    school: req.user.school,
    firstName, lastName, firstNameAr, lastNameAr, dateOfBirth, gender, address, wilaya, nationalId, medicalNotes,
    currentClass: currentClass || null,
    photo,
    studentId,
    admissionDate: new Date(),
  });
  if (currentClass && academicYear) {
    await Enrollment.create({ school: req.user.school, student: student._id, class: currentClass, academicYear });
  }
  req.flash('success', 'Élève créé avec succès');
  res.redirect('/admin/students');
};

exports.show = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, school: req.user.school })
    .populate('currentClass', 'name')
    .populate('parents').lean();
  if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/students/show', { title: `${student.firstName} ${student.lastName}`, student, layout: 'admin' });
};

exports.edit = async (req, res) => {
  const [student, classes] = await Promise.all([
    Student.findOne({ _id: req.params.id, school: req.user.school }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/students/form', { title: 'Modifier élève', student, classes, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { firstName, lastName, firstNameAr, lastNameAr, dateOfBirth, gender, address, wilaya, nationalId, medicalNotes, currentClass, status } = req.body;
  const update = { firstName, lastName, firstNameAr, lastNameAr, dateOfBirth, gender, address, wilaya, nationalId, medicalNotes, currentClass: currentClass || null, status };
  if (req.file) update.photo = req.file.filename;
  await Student.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, update);
  req.flash('success', 'Élève modifié avec succès');
  res.redirect('/admin/students');
};

exports.destroy = async (req, res) => {
  await Student.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Élève supprimé');
  res.redirect('/admin/students');
};

exports.generateIdCard = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, school: req.user.school })
    .populate('currentClass', 'name').lean();
  if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });
  const school = req.school;
  const pdfBuffer = await generateStudentIdCard(student, school);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="id-card-${student.studentId}.pdf"`);
  res.send(pdfBuffer);
};
