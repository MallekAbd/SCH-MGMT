const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  enrolledAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
