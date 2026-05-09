const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: String,
  term: String,
  averages: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    average: Number,
    grade: String,
  }],
  overallAverage: Number,
  rank: Number,
  totalStudents: Number,
  teacherComment: String,
  adminComment: String,
  pdfPath: String,
  generatedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('ReportCard', reportCardSchema);
