const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isSystem: { type: Boolean, default: false },
  permissions: [{
    module: String,
    actions: [{ type: String, enum: ['view', 'create', 'edit', 'delete', 'export'] }],
  }],
}, { timestamps: true });

roleSchema.index({ slug: 1, school: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Role', roleSchema);
