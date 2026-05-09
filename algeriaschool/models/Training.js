const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  description: String,
  duration: String,
  schedule: [{ date: Date, startTime: String, endTime: String, topic: String }],
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  fee: Number,
  currency: { type: String, default: 'DA' },
  maxParticipants: Number,
  enrollees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['enrolled', 'completed', 'dropped'], default: 'enrolled' },
    certificatePath: String,
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  }],
  isActive: { type: Boolean, default: true },
  certificateTemplate: String,
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingSchema);
