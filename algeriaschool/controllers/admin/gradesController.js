const Exam = require('../../models/Exam');
const Grade = require('../../models/Grade');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const Course = require('../../models/Course');
const Teacher = require('../../models/Teacher');
const ReportCard = require('../../models/ReportCard');
const { generateReportCard } = require('../../services/pdfService');

exports.index = async (req, res) => {
  const exams = await Exam.find({ school: req.user.school })
    .populate('course', 'name').populate('class', 'name')
    .sort({ date: -1 }).lean();
  res.render('admin/grades/index', { title: 'Notes', exams, layout: 'admin' });
};

exports.examsIndex = async (req, res) => {
  const exams = await Exam.find({ school: req.user.school })
    .populate('course', 'name').populate('class', 'name').sort({ createdAt: -1 }).lean();
  res.render('admin/grades/exams', { title: 'Examens', exams, layout: 'admin' });
};

exports.createExam = async (req, res) => {
  const [courses, classes] = await Promise.all([
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/grades/exam-form', { title: 'Nouvel examen', exam: null, courses, classes, layout: 'admin' });
};

exports.storeExam = async (req, res) => {
  const { name, type, course, class: classId, date, maxScore, weight, term, academicYear } = req.body;
  await Exam.create({ school: req.user.school, name, type, course, class: classId, date, maxScore, weight, term, academicYear });
  req.flash('success', 'Examen créé avec succès');
  res.redirect('/admin/grades/exams');
};

exports.enterGrades = async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.examId, school: req.user.school })
    .populate('course', 'name').populate('class', 'name').lean();
  if (!exam) return res.status(404).render('errors/404', { title: 'Not Found' });
  const students = await Student.find({ school: req.user.school, currentClass: exam.class._id, status: 'active' }).lean();
  const existing = await Grade.find({ exam: exam._id }).lean();
  const gradeMap = {};
  existing.forEach(g => { gradeMap[g.student.toString()] = g.score; });
  res.render('admin/grades/enter', { title: `Notes - ${exam.name}`, exam, students, gradeMap, layout: 'admin' });
};

exports.saveGrades = async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.examId, school: req.user.school }).lean();
  if (!exam) return res.status(404).render('errors/404', { title: 'Not Found' });
  const { grades: rawGrades } = req.body;
  const ops = Object.entries(rawGrades || {}).map(([studentId, score]) => ({
    updateOne: {
      filter: { school: req.user.school, student: studentId, exam: exam._id },
      update: { $set: { school: req.user.school, student: studentId, exam: exam._id, course: exam.course, class: exam.class, score: parseFloat(score) || 0, maxScore: exam.maxScore, enteredBy: req.user._id } },
      upsert: true,
    },
  }));
  if (ops.length) await Grade.bulkWrite(ops);
  req.flash('success', 'Notes enregistrées');
  res.redirect('/admin/grades/exams');
};

exports.reportCard = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, school: req.user.school })
    .populate('currentClass', 'name').lean();
  if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });
  const grades = await Grade.find({ student: student._id, school: req.user.school })
    .populate('course', 'name').populate('exam', 'type term weight').lean();
  const courseMap = {};
  grades.forEach(g => {
    const key = g.course._id.toString();
    if (!courseMap[key]) courseMap[key] = { course: g.course, scores: [] };
    courseMap[key].scores.push({ score: g.score, max: g.maxScore, weight: g.exam?.weight || 1 });
  });
  const averages = Object.values(courseMap).map(c => {
    const total = c.scores.reduce((sum, s) => sum + (s.score / s.max) * 20 * s.weight, 0);
    const weightSum = c.scores.reduce((sum, s) => sum + s.weight, 0);
    const avg = weightSum > 0 ? total / weightSum : 0;
    return { course: c.course, average: Math.round(avg * 100) / 100 };
  });
  const overallAverage = averages.length > 0 ? averages.reduce((s, a) => s + a.average, 0) / averages.length : 0;
  res.render('admin/grades/report-card', { title: `Bulletin - ${student.firstName} ${student.lastName}`, student, averages, overallAverage: Math.round(overallAverage * 100) / 100, layout: 'admin' });
};

exports.reportCardPdf = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, school: req.user.school }).populate('currentClass', 'name').lean();
  if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });
  const grades = await Grade.find({ student: student._id, school: req.user.school })
    .populate('course', 'name').populate('exam', 'type term weight').lean();
  const courseMap = {};
  grades.forEach(g => {
    const key = g.course._id.toString();
    if (!courseMap[key]) courseMap[key] = { course: g.course, scores: [] };
    courseMap[key].scores.push({ score: g.score, max: g.maxScore, weight: g.exam?.weight || 1 });
  });
  const averages = Object.values(courseMap).map(c => {
    const total = c.scores.reduce((sum, s) => sum + (s.score / s.max) * 20 * s.weight, 0);
    const weightSum = c.scores.reduce((sum, s) => sum + s.weight, 0);
    const avg = weightSum > 0 ? total / weightSum : 0;
    return { course: c.course, average: Math.round(avg * 100) / 100 };
  });
  const overallAverage = averages.length > 0 ? averages.reduce((s, a) => s + a.average, 0) / averages.length : 0;
  const pdfBuffer = await generateReportCard(student, averages, Math.round(overallAverage * 100) / 100, req.school);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="bulletin-${student.studentId || student._id}.pdf"`);
  res.send(pdfBuffer);
};
