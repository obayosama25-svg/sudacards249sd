const mongoose = require('mongoose');

const bankGatewaySchema = new mongoose.Schema({
    name: { type: String, required: true }, // اسم البنك (مثل: بنك الخرطوم - بنكك)
    code: { type: String, required: true, unique: true }, // كود البنك (BANKAK, FIB, ONB)
    apiUrl: { type: String, default: '' }, // رابط الـ API الخاص بسيرفر البنك
    apiKey: { type: String, default: '' }, // مفتاح الـ API والـ Token
    merchantAccount: { type: String, required: true }, // رقم حساب تجميع سوداكارد بالبنك
    validityHours: { type: Number, default: 6 }, // صلاحية رقم العملية بالساعات
    isActive: { type: Boolean, default: true },
    instructions: { type: String, default: 'قم بتحويل المبلغ إلى رقم الحساب الموضح أدناه عبر تطبيق البنك، ثم ادخل رقم العملية لمطابقتها لشحن رصيدك فورا.' },
    logoUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BankGateway', bankGatewaySchema);
