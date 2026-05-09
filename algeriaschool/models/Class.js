const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  level: String,
  academicYear: { type: String, required: true },
  capacity: { type: Number, default: 30 },
  room: String,
  homeTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
