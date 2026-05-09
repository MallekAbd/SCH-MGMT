const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: { type: String, unique: true, sparse: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  firstNameAr: String,
  lastNameAr: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female'] },
  photo: String,
  address: String,
  wilaya: String,
  nationalId: String,
  medicalNotes: String,
  documents: [{ name: String, path: String, uploadedAt: Date }],
  currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  enrollments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  status: { type: String, enum: ['active', 'graduated', 'transferred', 'withdrawn'], default: 'active' },
  admissionDate: Date,
}, { timestamps: true });

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
