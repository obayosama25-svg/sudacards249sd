const mongoose = require('mongoose');

// سجل المراجعة - يسجل كل إجراء إداري في النظام
const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "REFUND", "BLOCK_USER", "CHANGE_FEE"
    targetType: { type: String, required: true }, // "user", "transaction", "settings"
    targetId: { type: String }, // ID of the affected entity
    details: { type: mongoose.Schema.Types.Mixed }, // JSON object with before/after data
    ipAddress: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
