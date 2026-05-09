const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: String,
  type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  link: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
