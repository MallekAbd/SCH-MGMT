const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female'] },
  wilaya: String,
  address: String,
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  parentEmail: String,
  parentRelationship: { type: String, enum: ['father', 'mother', 'guardian'] },
  applyingForClass: String,
  academicYear: String,
  previousSchool: String,
  documents: [{ name: String, path: String }],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'enrolled'],
    default: 'pending',
  },
  notes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  convertedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
