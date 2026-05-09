const mongoose = require('mongoose');

const libraryItemSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['file', 'video_link', 'book'], required: true },
  filePath: String,
  videoUrl: String,
  isbn: String,
  author: String,
  copies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  downloads: { type: Number, default: 0 },
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LibraryItem', libraryItemSchema);
