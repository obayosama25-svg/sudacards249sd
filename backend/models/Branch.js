const mongoose = require('mongoose');

// نموذج الفروع
const branchSchema = new mongoose.Schema({
    branchCode: { type: String, required: true, unique: true }, // e.g., "KRT-001"
    name: { type: String, required: true }, // e.g., "فرع الخرطوم الرئيسي"
    address: { type: String },
    phone: { type: String },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
