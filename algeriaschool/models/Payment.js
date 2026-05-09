const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'DA' },
  method: { type: String, enum: ['cash', 'bank_transfer', 'ccp', 'baridibank'], required: true },
  reference: String,
  notes: String,
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pdfPath: String,
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
