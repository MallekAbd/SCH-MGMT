const Parent = require('../../models/Parent');
const Student = require('../../models/Student');
const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const Invoice = require('../../models/Invoice');
const Announcement = require('../../models/Announcement');
const Message = require('../../models/Message');

exports.index = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id, school: req.user.school })
      .populate({
        path: 'students',
        populate: { path: 'currentClass', select: 'name level' },
      })
      .lean();
    if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });

    const studentIds = parent.students.map(s => s._id);

    const [pendingInvoices, announcements, unreadMessages] = await Promise.all([
      Invoice.countDocuments({
        school: req.user.school,
        student: { $in: studentIds },
        status: { $in: ['pending', 'overdue'] },
      }),
      Announcement.find({
        school: req.user.school,
        $or: [{ targetRoles: 'all' }, { targetRoles: 'parent' }],
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      Message.countDocuments({ recipient: req.user._id, school: req.user.school, isRead: false }),
    ]);

    // Recent grades per child
    const recentGrades = await Grade.find({
      student: { $in: studentIds },
      school: req.user.school,
    })
      .populate('student', 'firstName lastName')
      .populate('course', 'name')
      .populate('exam', 'name type')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.render('parent/dashboard', {
      title: 'Espace parent',
      parent,
      children: parent.students,
      pendingInvoices,
      announcements,
      recentGrades,
      unreadMessages,
      layout: 'parent',
    });
  } catch (err) {
    next(err);
  }
};
