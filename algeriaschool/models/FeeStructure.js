const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['tuition', 'registration', 'transport', 'meals', 'other'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'DA' },
  billingPeriod: { type: String, enum: ['monthly', 'quarterly', 'semestrial', 'yearly', 'one_time'], default: 'monthly' },
  applicableClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  academicYear: String,
  lateFeeAmount: { type: Number, default: 0 },
  lateFeeAfterDays: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
