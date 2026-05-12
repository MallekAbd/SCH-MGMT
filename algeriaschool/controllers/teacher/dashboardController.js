const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const Schedule = require('../../models/Schedule');
const Announcement = require('../../models/Announcement');
const Exam = require('../../models/Exam');
const Message = require('../../models/Message');
const moment = require('moment');

exports.index = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school })
      .populate('classes', 'name level')
      .populate('courses', 'name code')
      .lean();

    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const today = moment().day(); // 0=Sun, 6=Sat
    const [todaySchedule, upcomingExams, recentMessages, announcements] = await Promise.all([
      Schedule.find({
        school: req.user.school,
        teacher: teacher._id,
        dayOfWeek: today,
      })
        .populate('course', 'name')
        .populate('class', 'name')
        .sort({ startTime: 1 })
        .lean(),
      Exam.find({
        school: req.user.school,
        teacher: teacher._id,
        date: { $gte: new Date() },
      })
        .populate('course', 'name')
        .populate('class', 'name')
        .sort({ date: 1 })
        .limit(5)
        .lean(),
      Message.find({ recipient: req.user._id, school: req.user.school, isRead: false })
        .populate('sender', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Announcement.find({
        school: req.user.school,
        $or: [{ targetRoles: 'all' }, { targetRoles: 'teacher' }],
        $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }],
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.render('teacher/dashboard', {
      title: 'Mon tableau de bord',
      teacher,
      todaySchedule,
      upcomingExams,
      recentMessages,
      announcements,
      unreadMessages: recentMessages.length,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};
