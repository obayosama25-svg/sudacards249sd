const mongoose = require('mongoose');

// نموذج حسابات النظام الداخلية (System/Suspense Accounts)
// هذه الحسابات ليست لعملاء حقيقيين - بل تمثل خزائن النظام المالية
const systemAccountSchema = new mongoose.Schema({
    accountCode: { type: String, required: true, unique: true }, // e.g., "SYS-REVENUE", "SYS-ZAIN"
    name: { type: String, required: true }, // "حساب إيرادات النظام"
    type: { 
        type: String, 
        enum: ['revenue', 'provider', 'suspense', 'settlement'], 
        required: true 
    },
    // revenue = حساب أرباح التطبيق (العمولات)
    // provider = حساب وسيط لمزود خدمة (زين، سوداني، الكهرباء)
    // suspense = حساب معلق (عمليات قيد التنفيذ)
    // settlement = حساب التسويات مع البنوك
    
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'SDG' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SystemAccount', systemAccountSchema);
