const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: String,
  specialization: String,
  qualifications: [String],
  contractType: { type: String, enum: ['permanent', 'contract', 'part_time'], default: 'permanent' },
  salaryBase: Number,
  hoursPerWeek: { type: Number, default: 0 },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  documents: [{ name: String, path: String }],
  joinDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
