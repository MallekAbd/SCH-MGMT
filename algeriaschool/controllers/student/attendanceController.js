const Student = require('../../models/Student');
const Attendance = require('../../models/Attendance');
const moment = require('moment');

exports.index = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school })
      .populate('currentClass', 'name')
      .lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const attendances = await Attendance.find({
      school: req.user.school,
      'records.student': student._id,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    })
      .populate('class', 'name')
      .populate('course', 'name')
      .sort({ date: -1 })
      .lean();

    // Extract this student's record from each session
    const records = attendances.map(a => {
      const record = a.records.find(r => r.student.toString() === student._id.toString());
      return {
        date: a.date,
        class: a.class,
        course: a.course,
        status: record?.status || 'unknown',
        note: record?.note || '',
      };
    });

    // Summary stats
    const summary = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach(r => {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });
    const total = records.length;
    const attendanceRate = total > 0
      ? Math.round((summary.present + summary.late) / total * 100)
      : null;

    res.render('student/attendance/index', {
      title: 'Mes présences',
      student,
      records,
      summary,
      attendanceRate,
      total,
      from: from || '',
      to: to || '',
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
