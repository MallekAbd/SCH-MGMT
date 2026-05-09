const Student = require('../../models/Student');
const Grade = require('../../models/Grade');
const Exam = require('../../models/Exam');

exports.index = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school })
      .populate('currentClass', 'name level')
      .lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { term, academicYear } = req.query;
    const gradeFilter = { student: student._id, school: req.user.school };

    const grades = await Grade.find(gradeFilter)
      .populate('course', 'name code credits')
      .populate('exam', 'name type term weight academicYear')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by term/year if provided
    const filtered = grades.filter(g => {
      if (term && g.exam?.term !== term) return false;
      if (academicYear && g.exam?.academicYear !== academicYear) return false;
      return true;
    });

    // Group by course and compute averages
    const courseMap = {};
    filtered.forEach(g => {
      const key = g.course._id.toString();
      if (!courseMap[key]) courseMap[key] = { course: g.course, grades: [] };
      courseMap[key].grades.push(g);
    });

    const courseSummaries = Object.values(courseMap).map(c => {
      const totalWeighted = c.grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20 * (g.exam?.weight || 1), 0);
      const weightSum = c.grades.reduce((sum, g) => sum + (g.exam?.weight || 1), 0);
      const avg = weightSum > 0 ? totalWeighted / weightSum : 0;
      return {
        course: c.course,
        grades: c.grades,
        average: Math.round(avg * 100) / 100,
      };
    });

    const overallAverage = courseSummaries.length > 0
      ? courseSummaries.reduce((s, c) => s + c.average, 0) / courseSummaries.length
      : 0;

    res.render('student/grades/index', {
      title: 'Mes notes',
      student,
      courseSummaries,
      overallAverage: Math.round(overallAverage * 100) / 100,
      term: term || '',
      academicYear: academicYear || '',
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
