const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'semestrial', 'biannual', 'yearly'],
    default: 'monthly',
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'DA' },
  status: {
    type: String,
    enum: ['active', 'expired', 'grace', 'locked', 'trial'],
    default: 'trial',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  graceEndsAt: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'ccp', 'baridibank'],
  },
  paymentRef: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
