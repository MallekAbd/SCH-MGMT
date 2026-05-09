const Parent = require('../../models/Parent');
const Student = require('../../models/Student');
const Grade = require('../../models/Grade');

exports.index = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id, school: req.user.school })
      .populate('students', 'firstName lastName currentClass studentId')
      .lean();
    if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { studentId, term, academicYear } = req.query;

    // Default to first child if none selected
    const selectedStudentId = studentId || (parent.students[0]?._id?.toString());
    const selectedStudent = parent.students.find(s => s._id.toString() === selectedStudentId);

    let courseSummaries = [];
    let overallAverage = 0;

    if (selectedStudent) {
      const gradeFilter = { student: selectedStudent._id, school: req.user.school };
      const grades = await Grade.find(gradeFilter)
        .populate('course', 'name code credits')
        .populate('exam', 'name type term weight academicYear')
        .sort({ createdAt: -1 })
        .lean();

      const filtered = grades.filter(g => {
        if (term && g.exam?.term !== term) return false;
        if (academicYear && g.exam?.academicYear !== academicYear) return false;
        return true;
      });

      const courseMap = {};
      filtered.forEach(g => {
        const key = g.course._id.toString();
        if (!courseMap[key]) courseMap[key] = { course: g.course, grades: [] };
        courseMap[key].grades.push(g);
      });

      courseSummaries = Object.values(courseMap).map(c => {
        const totalWeighted = c.grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20 * (g.exam?.weight || 1), 0);
        const weightSum = c.grades.reduce((sum, g) => sum + (g.exam?.weight || 1), 0);
        const avg = weightSum > 0 ? totalWeighted / weightSum : 0;
        return {
          course: c.course,
          grades: c.grades,
          average: Math.round(avg * 100) / 100,
        };
      });

      overallAverage = courseSummaries.length > 0
        ? courseSummaries.reduce((s, c) => s + c.average, 0) / courseSummaries.length
        : 0;
    }

    res.render('parent/grades/index', {
      title: 'Notes de mes enfants',
      children: parent.students,
      selectedStudent,
      courseSummaries,
      overallAverage: Math.round(overallAverage * 100) / 100,
      term: term || '',
      academicYear: academicYear || '',
      layout: 'parent',
    });
  } catch (err) {
    next(err);
  }
};
