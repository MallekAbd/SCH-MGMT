const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  category: { type: String, enum: ['salary', 'utilities', 'supplies', 'maintenance', 'other'], required: true },
  description: { type: String, required: true },
  vendor: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'DA' },
  date: { type: Date, required: true },
  attachment: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
