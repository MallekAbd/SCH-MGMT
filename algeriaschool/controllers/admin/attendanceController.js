const Attendance = require('../../models/Attendance');
const Class = require('../../models/Class');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const { sendMail } = require('../../config/mailer');
const Parent = require('../../models/Parent');
const User = require('../../models/User');
const moment = require('moment');

exports.index = async (req, res) => {
  const { classId, date } = req.query;
  const filter = { school: req.user.school };
  if (classId) filter.class = classId;
  if (date) filter.date = { $gte: moment(date).startOf('day').toDate(), $lte: moment(date).endOf('day').toDate() };
  const [attendances, classes] = await Promise.all([
    Attendance.find(filter).populate('class', 'name').populate('teacher').sort({ date: -1 }).limit(50).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/attendance/index', { title: 'Présences', attendances, classes, classId: classId || '', date: date || '', layout: 'admin' });
};

exports.markForm = async (req, res) => {
  const cls = await Class.findOne({ _id: req.params.classId, school: req.user.school }).lean();
  if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });
  const students = await Student.find({ school: req.user.school, currentClass: cls._id, status: 'active' }).lean();
  res.render('admin/attendance/mark', { title: `Présence - ${cls.name}`, cls, students, today: moment().format('YYYY-MM-DD'), layout: 'admin' });
};

exports.mark = async (req, res) => {
  const cls = await Class.findOne({ _id: req.params.classId, school: req.user.school }).lean();
  if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });
  const { date, records: rawRecords } = req.body;
  const teacher = await Teacher.findOne({ school: req.user.school, user: req.user._id });
  const records = Object.entries(rawRecords || {}).map(([studentId, data]) => ({
    student: studentId,
    status: data.status || 'present',
    note: data.note || '',
  }));

  await Attendance.findOneAndUpdate(
    {
      school: req.user.school,
      class: req.params.classId,
      date: { $gte: moment(date).startOf('day').toDate(), $lte: moment(date).endOf('day').toDate() },
    },
    {
      school: req.user.school,
      class: req.params.classId,
      teacher: teacher?._id || req.user._id,
      date: new Date(date),
      records,
    },
    { upsert: true, new: true }
  );

  // Notify parents of absent students
  const absentStudentIds = records.filter(r => r.status === 'absent').map(r => r.student);
  if (absentStudentIds.length) {
    const students = await Student.find({ _id: { $in: absentStudentIds } }).lean();
    for (const student of students) {
      const parents = await Parent.find({ students: student._id }).populate('user', 'email firstName').lean();
      for (const parent of parents) {
        if (parent.user?.email) {
          await sendMail({
            to: parent.user.email,
            subject: `Absence de ${student.firstName} ${student.lastName}`,
            html: `<p>Cher(e) ${parent.user.firstName},</p>
                   <p>Votre enfant <strong>${student.firstName} ${student.lastName}</strong> était absent(e) le ${moment(date).format('DD/MM/YYYY')}.</p>`,
          });
        }
      }
    }
  }

  req.flash('success', 'Présences enregistrées');
  res.redirect('/admin/attendance');
};

exports.report = async (req, res) => {
  const { studentId, classId, from, to } = req.query;
  const filter = { school: req.user.school };
  if (classId) filter.class = classId;
  if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };
  const attendances = await Attendance.find(filter)
    .populate('class', 'name')
    .populate('records.student', 'firstName lastName')
    .sort({ date: -1 }).lean();
  const classes = await Class.find({ school: req.user.school, isActive: true }).lean();
  res.render('admin/attendance/report', { title: 'Rapport de présence', attendances, classes, classId: classId || '', from: from || '', to: to || '', layout: 'admin' });
};
