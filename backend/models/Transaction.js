const mongoose = require('mongoose');

// نموذج دفتر الأستاذ المحسن (Enhanced Ledger Transaction)
const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true }, // TX-00001

    // ─── أطراف القيد المزدوج (Double Entry) ──────────────────
    drAccount: { type: String, required: true }, // الحساب المدين (الذي نُقص منه)
    crAccount: { type: String, required: true }, // الحساب الدائن (الذي زاد فيه)

    senderId: { type: String, required: true },
    senderName: { type: String },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },

    // ─── المبالغ المحاسبية ────────────────────────────────────
    baseAmount: { type: Number, required: true },       // المبلغ الأصلي للخدمة
    systemFee: { type: Number, default: 0 },            // عمولة التطبيق (إيراد SudaCards)
    providerFee: { type: Number, default: 0 },          // رسوم مزود الخدمة (إن وجدت)
    totalAmount: { type: Number, required: true },      // المبلغ الكلي المخصوم = base + systemFee + providerFee
    currency: { type: String, default: 'SDG' },

    // ─── التصنيف ──────────────────────────────────────────────
    type: { type: String, enum: ['credit', 'debit'], required: true },
    category: { 
        type: String, 
        enum: ['transfer', 'electricity', 'telecom', 'education', 'airlines', 'nfc_payment', 'deposit', 'withdrawal', 'refund'],
        required: true 
    },

    // ─── الحالة والمرجعية ─────────────────────────────────────
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'reversed'], 
        default: 'pending' 
    },
    
    paymentMethod: { type: String, enum: ['wallet', 'nfc', 'bank_card'], default: 'wallet' },
    
    // مرجع خارجي (البنك المركزي أو مزود الخدمة) - للمطابقة
    externalRef: { type: String },
    // إذا كانت هذه العملية قيد عكسي، هنا نربطها بالأصلية
    reversalOf: { type: String, default: null },
    
    // حالة المطابقة (Reconciliation)
    isReconciled: { type: Boolean, default: false },
    reconciledAt: { type: Date },
    reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },

    // ─── بيانات إضافية ────────────────────────────────────────
    note: { type: String },
    branchId: { type: String, default: 'HEAD_QUARTERS' }, // أي فرع أجرى العملية

}, { timestamps: true });

// Indexes for fast queries
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ branchId: 1 });
transactionSchema.index({ isReconciled: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
