const mongoose = require('mongoose');

const usedBankTransactionSchema = new mongoose.Schema({
    bankCode: { type: String, required: true }, // كود البنك (BANKAK, FIB...)
    referenceNumber: { type: String, required: true }, // رقم العملية البنكية (Unique per bank)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userAccount: { type: String, default: '' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'refunded', 'expired'], default: 'completed' },
    usedAt: { type: Date, default: Date.now }
});

// فهرس موحد يضمن عدم تكرار رقم العملية للبنك نفسه نهائياً
usedBankTransactionSchema.index({ bankCode: 1, referenceNumber: 1 }, { unique: true });

module.exports = mongoose.model('UsedBankTransaction', usedBankTransactionSchema);
