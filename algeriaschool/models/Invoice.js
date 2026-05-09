const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  invoiceNumber: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  items: [{
    description: String,
    feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    amount: Number,
    quantity: { type: Number, default: 1 },
  }],
  subtotal: Number,
  lateFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: Number,
  amountPaid: { type: Number, default: 0 },
  balance: Number,
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  dueDate: Date,
  pdfPath: String,
  period: String,
  academicYear: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
