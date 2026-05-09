const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true },
  type: {
    type: String,
    enum: ['preschool', 'primary', 'middle', 'high', 'university', 'training', 'private'],
    required: true,
  },
  logo: String,
  address: {
    street: String,
    city: String,
    wilaya: String,
    postalCode: String,
  },
  phone: String,
  email: String,
  website: String,
  registrationNumber: String,
  settings: {
    gradeScale: { type: Number, default: 20 },
    academicYear: { type: String, default: '2024-2025' },
    currency: { type: String, default: 'DA' },
    timezone: { type: String, default: 'Africa/Algiers' },
    twoFactorEnabled: { type: Boolean, default: false },
    defaultLang: { type: String, default: 'fr' },
  },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  trialEndsAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
