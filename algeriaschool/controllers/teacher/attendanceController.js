const Attendance = require('../../models/Attendance');
const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const Student = require('../../models/Student');
const Parent = require('../../models/Parent');
const { sendMail } = require('../../config/mailer');
const moment = require('moment');

exports.index = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { classId, date } = req.query;
    const filter = { school: req.user.school, teacher: teacher._id };
    if (classId) filter.class = classId;
    if (date) {
      filter.date = {
        $gte: moment(date).startOf('day').toDate(),
        $lte: moment(date).endOf('day').toDate(),
      };
    }

    const [attendances, classes] = await Promise.all([
      Attendance.find(filter)
        .populate('class', 'name')
        .sort({ date: -1 })
        .limit(30)
        .lean(),
      Class.find({ _id: { $in: teacher.classes }, school: req.user.school }).lean(),
    ]);

    res.render('teacher/attendance/index', {
      title: 'Mes présences',
      attendances,
      classes,
      classId: classId || '',
      date: date || '',
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.markForm = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const cls = await Class.findOne({
      _id: req.params.classId,
      school: req.user.school,
    }).lean();
    if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });

    // Verify teacher owns this class
    if (!teacher.classes.some(c => c.toString() === cls._id.toString())) {
      return res.status(403).render('errors/403', { title: 'Access Denied' });
    }

    const students = await Student.find({
      school: req.user.school,
      currentClass: cls._id,
      status: 'active',
    }).sort({ lastName: 1 }).lean();

    const today = moment().format('YYYY-MM-DD');
    const existing = await Attendance.findOne({
      school: req.user.school,
      class: cls._id,
      teacher: teacher._id,
      date: { $gte: moment(today).startOf('day').toDate(), $lte: moment(today).endOf('day').toDate() },
    }).lean();

    const existingMap = {};
    if (existing) {
      existing.records.forEach(r => {
        existingMap[r.student.toString()] = r;
      });
    }

    res.render('teacher/attendance/mark', {
      title: `Présence - ${cls.name}`,
      cls,
      students,
      today,
      existingMap,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.mark = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const cls = await Class.findOne({ _id: req.params.classId, school: req.user.school }).lean();
    if (!cls) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { date, records: rawRecords } = req.body;
    const records = Object.entries(rawRecords || {}).map(([studentId, data]) => ({
      student: studentId,
      status: data.status || 'present',
      note: data.note || '',
    }));

    await Attendance.findOneAndUpdate(
      {
        school: req.user.school,
        class: req.params.classId,
        teacher: teacher._id,
        date: {
          $gte: moment(date).startOf('day').toDate(),
          $lte: moment(date).endOf('day').toDate(),
        },
      },
      {
        school: req.user.school,
        class: req.params.classId,
        teacher: teacher._id,
        date: new Date(date),
        records,
      },
      { upsert: true, new: true }
    );

    // Notify parents of absent students
    const absentStudentIds = records.filter(r => r.status === 'absent').map(r => r.student);
    if (absentStudentIds.length) {
      const absentStudents = await Student.find({ _id: { $in: absentStudentIds } }).lean();
      for (const student of absentStudents) {
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
    res.redirect('/teacher/attendance');
  } catch (err) {
    next(err);
  }
};
