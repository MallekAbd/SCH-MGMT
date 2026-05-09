const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  phone: String,
  avatar: String,
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'sub_admin', 'teacher', 'student', 'parent', 'accountant'],
    required: true,
  },
  customRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  otpSecret: String,
  otpExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
  lastLogin: Date,
  lang: { type: String, enum: ['fr', 'ar', 'en'], default: 'fr' },
}, { timestamps: true });

userSchema.index({ email: 1, school: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, {
  unique: true,
  partialFilterExpression: { school: { $exists: false } },
  sparse: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
