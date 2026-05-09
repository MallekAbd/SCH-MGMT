const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  studentLimit: { type: Number, required: true },
  prices: {
    monthly: { type: Number, required: true },
    quarterly: Number,
    semestrial: Number,
    biannual: Number,
    yearly: Number,
  },
  features: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
