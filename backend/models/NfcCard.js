const mongoose = require('mongoose');

const nfcCardSchema = new mongoose.Schema({
    cardId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['Physical', 'Virtual', 'Bracelet'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Active', 'Suspended', 'Lost'], 
        default: 'Active' 
    },
    issueDate: { type: Date, default: Date.now },
    lastUsed: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('NfcCard', nfcCardSchema);
