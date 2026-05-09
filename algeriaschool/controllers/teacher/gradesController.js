const Exam = require('../../models/Exam');
const Grade = require('../../models/Grade');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');

exports.index = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const exams = await Exam.find({ school: req.user.school, teacher: teacher._id })
      .populate('course', 'name')
      .populate('class', 'name')
      .sort({ date: -1 })
      .lean();

    res.render('teacher/grades/index', {
      title: 'Mes examens',
      exams,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.enterGrades = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const exam = await Exam.findOne({
      _id: req.params.examId,
      school: req.user.school,
      teacher: teacher._id,
    })
      .populate('course', 'name')
      .populate('class', 'name')
      .lean();
    if (!exam) return res.status(404).render('errors/404', { title: 'Not Found' });

    const students = await Student.find({
      school: req.user.school,
      currentClass: exam.class._id,
      status: 'active',
    })
      .sort({ lastName: 1 })
      .lean();

    const existing = await Grade.find({ exam: exam._id }).lean();
    const gradeMap = {};
    existing.forEach(g => { gradeMap[g.student.toString()] = g.score; });

    res.render('teacher/grades/enter', {
      title: `Notes - ${exam.name}`,
      exam,
      students,
      gradeMap,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.saveGrades = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const exam = await Exam.findOne({
      _id: req.params.examId,
      school: req.user.school,
      teacher: teacher._id,
    }).lean();
    if (!exam) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { grades: rawGrades } = req.body;
    const ops = Object.entries(rawGrades || {}).map(([studentId, score]) => ({
      updateOne: {
        filter: { school: req.user.school, student: studentId, exam: exam._id },
        update: {
          $set: {
            school: req.user.school,
            student: studentId,
            exam: exam._id,
            course: exam.course,
            class: exam.class,
            score: parseFloat(score) || 0,
            maxScore: exam.maxScore,
            enteredBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));
    if (ops.length) await Grade.bulkWrite(ops);
    req.flash('success', 'Notes enregistrées avec succès');
    res.redirect('/teacher/grades');
  } catch (err) {
    next(err);
  }
};
