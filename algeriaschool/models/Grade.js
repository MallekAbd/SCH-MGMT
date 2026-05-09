const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 20 },
  comment: String,
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

gradeSchema.index({ school: 1, student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
