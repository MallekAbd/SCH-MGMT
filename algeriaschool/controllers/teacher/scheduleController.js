const Schedule = require('../../models/Schedule');
const Teacher = require('../../models/Teacher');

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

exports.index = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!teacher) return res.status(404).render('errors/404', { title: 'Not Found' });

    const schedules = await Schedule.find({ school: req.user.school, teacher: teacher._id })
      .populate('course', 'name code')
      .populate('class', 'name level')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    // Group by day of week
    const byDay = {};
    DAY_NAMES.forEach((name, idx) => { byDay[idx] = { name, sessions: [] }; });
    schedules.forEach(s => {
      if (byDay[s.dayOfWeek]) byDay[s.dayOfWeek].sessions.push(s);
    });

    res.render('teacher/schedule/index', {
      title: 'Mon emploi du temps',
      byDay,
      dayNames: DAY_NAMES,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};
