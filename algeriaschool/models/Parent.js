const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relationship: { type: String, enum: ['father', 'mother', 'guardian'], default: 'father' },
  profession: String,
  employer: String,
  alternatePhone: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);
