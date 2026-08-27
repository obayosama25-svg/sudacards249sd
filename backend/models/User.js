const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // 12 digits from app
    accountNumber: { type: String, required: true, unique: true }, // 8 digits
    email: { type: String, required: true, unique: true },
    
    // Security
    loginPasswordHash: { type: String, required: true },
    passwordHash: { type: String, required: true },
    pinHash: { type: String, required: true },
    hasSetPin: { type: Boolean, default: false },
    
    // Advanced Security
    failedLoginAttempts: { type: Number, default: 0 },
    deviceChangeAttempts: { type: Number, default: 0 },
    pendingDeviceId: { type: String, default: null },
    isLocked: { type: Boolean, default: false },
    
    // Personal Info
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    idImagePath: { type: String },
    personalPhotoPath: { type: String },
    signaturePhotoPath: { type: String },
    logoPhotoPath: { type: String },
    phone: { type: String },
    commercialReg: { type: String },
    address: { type: String },
    managerName: { type: String },

    // OTP Verification
    otpCode: { type: String },
    otpExpires: { type: Date },
    // Banking Info
    balance: { type: Number, default: 0.0 },
    
    // System fields
    deviceId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    biometricEnabled: { type: Boolean, default: false },
    biometricDeviceId: { type: String, default: null },
    userType: { 
        type: String, 
        enum: ['personal', 'merchant', 'company', 'restaurant', 'cafe', 'hospital', 'health_center', 'pharmacy', 'university'], 
        default: 'personal' 
    },
    status: {
        type: String,
        enum: ['unverified', 'pending', 'approved', 'rejected'],
        default: 'unverified'
    },
    
    // Notifications & FCM
    fcmToken: { type: String, default: null },
    notificationPreferences: {
        transfers: { type: Boolean, default: true },
        deposits: { type: Boolean, default: true },
        withdrawals: { type: Boolean, default: true },
        nfcPayments: { type: Boolean, default: true },
        loginAlerts: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
        statements: { type: Boolean, default: false },
    },
    
    // Security Questions
    hasSecurityQuestions: { type: Boolean, default: false },
    securityQuestions: [{
        question: { type: String, required: true },
        answerHash: { type: String, required: true }
    }]
}, { timestamps: true });

// Create a virtual for fullName
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.middleName} ${this.lastName}`.trim();
});

module.exports = mongoose.model('User', userSchema);
