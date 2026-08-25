const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    
    // RBAC
    role: { 
        type: String, 
        enum: ['superadmin', 'manager', 'teller'], 
        required: true 
    },
    
    // Hierarchy
    branchId: { type: String, default: 'HEAD_QUARTERS' }, // Link to a branch
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }, // Who created this user?
    
    // Settings & Limits
    dailyTransferLimit: { type: Number, default: 0 }, // Applicable for tellers
    isActive: { type: Boolean, default: true },
    
}, { timestamps: true });

module.exports = mongoose.model('AdminUser', adminUserSchema);
