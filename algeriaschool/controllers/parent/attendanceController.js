const Parent = require('../../models/Parent');
const Attendance = require('../../models/Attendance');
const moment = require('moment');

exports.index = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id, school: req.user.school })
      .populate('students', 'firstName lastName currentClass studentId')
      .lean();
    if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { studentId, from, to } = req.query;
    const selectedStudentId = studentId || parent.students[0]?._id?.toString();
    const selectedStudent = parent.students.find(s => s._id.toString() === selectedStudentId);

    let records = [];
    let summary = { present: 0, absent: 0, late: 0, excused: 0 };
    let attendanceRate = null;

    if (selectedStudent) {
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);

      const attendances = await Attendance.find({
        school: req.user.school,
        'records.student': selectedStudent._id,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
      })
        .populate('class', 'name')
        .populate('course', 'name')
        .sort({ date: -1 })
        .lean();

      records = attendances.map(a => {
        const record = a.records.find(r => r.student.toString() === selectedStudent._id.toString());
        return {
          date: a.date,
          class: a.class,
          course: a.course,
          status: record?.status || 'unknown',
          note: record?.note || '',
        };
      });

      records.forEach(r => {
        if (summary[r.status] !== undefined) summary[r.status]++;
      });
      const total = records.length;
      attendanceRate = total > 0
        ? Math.round((summary.present + summary.late) / total * 100)
        : null;
    }

    res.render('parent/attendance/index', {
      title: 'Présences de mes enfants',
      children: parent.students,
      selectedStudent,
      records,
      summary,
      attendanceRate,
      from: from || '',
      to: to || '',
      layout: 'parent',
    });
  } catch (err) {
    next(err);
  }
};
