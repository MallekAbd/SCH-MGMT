const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRoles: [{ type: String, enum: ['all', 'teacher', 'student', 'parent'] }],
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  isPinned: { type: Boolean, default: false },
  expiresAt: Date,
  attachments: [String],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
