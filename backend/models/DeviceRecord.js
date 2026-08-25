const mongoose = require('mongoose');

const deviceRecordSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    transferCount: { type: Number, default: 0 },
    history: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        accountNumber: { type: String, required: true },
        name: { type: String, required: true },
        linkedAt: { type: Date, default: Date.now },
        unlinkedAt: { type: Date, default: null }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('DeviceRecord', deviceRecordSchema);
