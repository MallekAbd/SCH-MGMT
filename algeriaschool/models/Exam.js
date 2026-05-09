const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['quiz', 'midterm', 'final', 'project', 'continuous'], required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  date: Date,
  maxScore: { type: Number, default: 20 },
  weight: { type: Number, default: 1 },
  term: { type: String, enum: ['T1', 'T2', 'T3', 'annual'], default: 'T1' },
  academicYear: String,
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
