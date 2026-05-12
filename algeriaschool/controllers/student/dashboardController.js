const Student = require('../../models/Student');
const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const Invoice = require('../../models/Invoice');
const Announcement = require('../../models/Announcement');
const Schedule = require('../../models/Schedule');
const Message = require('../../models/Message');
const moment = require('moment');

exports.index = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school })
      .populate('currentClass', 'name level')
      .lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    const today = moment().day();
    const [
      recentGrades,
      attendanceSummary,
      pendingInvoices,
      announcements,
      todaySchedule,
      unreadMessages,
    ] = await Promise.all([
      Grade.find({ student: student._id, school: req.user.school })
        .populate('course', 'name')
        .populate('exam', 'name type')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Attendance.aggregate([
        { $match: { school: req.user.school, 'records.student': student._id } },
        { $unwind: '$records' },
        { $match: { 'records.student': student._id } },
        { $group: { _id: '$records.status', count: { $sum: 1 } } },
      ]),
      Invoice.countDocuments({
        school: req.user.school,
        student: student._id,
        status: { $in: ['pending', 'overdue'] },
      }),
      Announcement.find({
        school: req.user.school,
        $or: [
          { targetRoles: 'all' },
          { targetRoles: 'student' },
          { targetClasses: student.currentClass?._id },
        ],
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      student.currentClass
        ? Schedule.find({
            school: req.user.school,
            class: student.currentClass._id,
            dayOfWeek: today,
          })
            .populate('course', 'name')
            .populate({ path: 'teacher', populate: { path: 'user', select: 'firstName lastName' } })
            .sort({ startTime: 1 })
            .lean()
        : [],
      Message.countDocuments({ recipient: req.user._id, school: req.user.school, isRead: false }),
    ]);

    const attendanceMap = {};
    attendanceSummary.forEach(a => { attendanceMap[a._id] = a.count; });
    const totalAttendance = Object.values(attendanceMap).reduce((s, v) => s + v, 0);
    const attendanceRate = totalAttendance > 0
      ? Math.round(((attendanceMap.present || 0) + (attendanceMap.late || 0)) / totalAttendance * 100)
      : null;

    const avgScore = recentGrades.length
      ? recentGrades.reduce((sum, g) => sum + g.score, 0) / recentGrades.length
      : 0;

    res.render('student/dashboard', {
      title: 'Mon espace',
      student,
      recentGrades,
      attendanceRate,
      pendingInvoices,
      announcements,
      todaySchedule,
      unreadMessages,
      stats: {
        avg: avgScore,
        attendance: attendanceRate ?? 100,
        upcomingExams: 0,
        invoices: pendingInvoices,
      },
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
