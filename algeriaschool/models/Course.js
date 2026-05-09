const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  sector: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector' },
  code: { type: String, required: true },
  name: { type: String, required: true },
  nameAr: String,
  description: String,
  credits: { type: Number, default: 1 },
  hoursPerWeek: { type: Number, default: 1 },
  level: String,
  syllabus: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
