const Schedule = require('../../models/Schedule');
const Student = require('../../models/Student');

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

exports.index = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school })
      .populate('currentClass', 'name level')
      .lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    if (!student.currentClass) {
      return res.render('student/schedule/index', {
        title: 'Mon emploi du temps',
        student,
        byDay: {},
        dayNames: DAY_NAMES,
        layout: 'student',
      });
    }

    const schedules = await Schedule.find({
      school: req.user.school,
      class: student.currentClass._id,
    })
      .populate('course', 'name code')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    const byDay = {};
    DAY_NAMES.forEach((name, idx) => { byDay[idx] = { name, sessions: [] }; });
    schedules.forEach(s => {
      if (byDay[s.dayOfWeek]) byDay[s.dayOfWeek].sessions.push(s);
    });

    res.render('student/schedule/index', {
      title: 'Mon emploi du temps',
      student,
      byDay,
      dayNames: DAY_NAMES,
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
