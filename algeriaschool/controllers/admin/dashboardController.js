const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const Attendance = require('../../models/Attendance');
const Announcement = require('../../models/Announcement');
const Expense = require('../../models/Expense');
const moment = require('moment');

exports.index = async (req, res, next) => {
  try {
    const schoolId = req.user.school;
    const today = moment().startOf('day').toDate();
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingInvoices,
      monthlyRevenue,
      monthlyExpenses,
      recentAnnouncements,
      recentPayments,
    ] = await Promise.all([
      Student.countDocuments({ school: schoolId, status: 'active' }),
      Teacher.countDocuments({ school: schoolId, isActive: true }),
      Class.countDocuments({ school: schoolId, isActive: true }),
      Invoice.countDocuments({ school: schoolId, status: { $in: ['pending', 'partial', 'overdue'] } }),
      Payment.aggregate([
        { $match: { school: schoolId, paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { school: schoolId, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Announcement.find({ school: schoolId }).sort({ createdAt: -1 }).limit(5).lean(),
      Payment.find({ school: schoolId }).sort({ createdAt: -1 }).limit(10)
        .populate('student', 'firstName lastName').lean(),
    ]);

    // Enrollment trend last 6 months
    const enrollmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const m = moment().subtract(i, 'months');
      const count = await Student.countDocuments({
        school: schoolId,
        createdAt: { $lte: m.endOf('month').toDate() },
        status: 'active',
      });
      enrollmentTrend.push({ month: m.format('MMM'), count });
    }

    res.render('admin/dashboard', {
      title: 'Tableau de bord',
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        pendingInvoices,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
      },
      recentAnnouncements,
      recentPayments,
      enrollmentTrend: JSON.stringify(enrollmentTrend),
      layout: 'admin',
    });
  } catch (err) {
    next(err);
  }
};
