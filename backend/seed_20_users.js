require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Load MongoDB Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const SystemAccount = require('./models/SystemAccount');

// Connection URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sudacards_admin';

// Helper: Generate SHA-256 hash (same as Flutter AuthService.hashValue)
function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

// Mock Data Definitions
// Mock Data Templates for different types
const userTemplates = [
    { type: 'personal', first: 'أحمد', middle: 'الطيب', last: 'البشير', email: 'ahmed.tayeb@sudacards.com' },
    { type: 'personal', first: 'فاطمة', middle: 'الزهراء', last: 'النور', email: 'fatima.nour@sudacards.com' },
    { type: 'personal', first: 'محمد', middle: 'عبدالله', last: 'الفاضل', email: 'mohammed.abdullah@sudacards.com' },
    { type: 'personal', first: 'عائشة', middle: 'إبراهيم', last: 'حسن', email: 'aisha.ibrahim@sudacards.com' },
    { type: 'personal', first: 'عمر', middle: 'خالد', last: 'الطيب', email: 'omar.khaled@sudacards.com' },
    { type: 'personal', first: 'مريم', middle: 'يوسف', last: 'عثمان', email: 'maryam.youssef@sudacards.com' },
    { type: 'personal', first: 'عثمان', middle: 'علي', last: 'البشير', email: 'osman.ali@sudacards.com' },
    
    { type: 'merchant', first: 'تاجر أحمد للمنسوجات', middle: ' ', last: ' ', email: 'ahmed.textiles@sudacards.com' },
    { type: 'merchant', first: 'بقالة الأمانة للتموين', middle: ' ', last: ' ', email: 'amana.grocery@sudacards.com' },
    
    { type: 'company', first: 'شركة النيل الأزرق للخدمات', middle: ' ', last: ' ', email: 'blue.nile@sudacards.com' },
    { type: 'company', first: 'شركة الفهد للاستيراد والتصدير', middle: ' ', last: ' ', email: 'alfahad.co@sudacards.com' },
    
    { type: 'restaurant', first: 'مطعم المدينة الشعبي', middle: ' ', last: ' ', email: 'almadina.restaurant@sudacards.com' },
    { type: 'restaurant', first: 'مطعم الجمر للمشويات', middle: ' ', last: ' ', email: 'aljamr.grill@sudacards.com' },
    
    { type: 'cafe', first: 'أروما كافيه الفاخر', middle: ' ', last: ' ', email: 'aroma.cafe@sudacards.com' },
    { type: 'cafe', first: 'كافيه فنجان قهوة', middle: ' ', last: ' ', email: 'fenjan.cafe@sudacards.com' },
    
    { type: 'hospital', first: 'مستشفى شرق النيل', middle: ' ', last: ' ', email: 'shargalnile.hospital@sudacards.com' },
    { type: 'hospital', first: 'مستشفى علياء الدولي', middle: ' ', last: ' ', email: 'alya.hospital@sudacards.com' },
    
    { type: 'health_center', first: 'مركز النور الطبي', middle: ' ', last: ' ', email: 'alnoor.medical@sudacards.com' },
    { type: 'health_center', first: 'مركز الشفاء الصحي', middle: ' ', last: ' ', email: 'alshifa.center@sudacards.com' },
    
    { type: 'pharmacy', first: 'صيدلية مكة الكبرى', middle: ' ', last: ' ', email: 'makka.pharmacy@sudacards.com' },
    
    { type: 'university', first: 'جامعة الخرطوم', middle: ' ', last: ' ', email: 'uofk.edu@sudacards.com' },
    { type: 'university', first: 'جامعة السودان للعلوم والتكنولوجيا', middle: ' ', last: ' ', email: 'sust.edu@sudacards.com' }
];

async function seedData() {
    try {
        console.log('🔄 جاري الاتصال بقاعدة البيانات...');
        await mongoose.connect(mongoURI);
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح.');

        // 1. مسح البيانات القديمة للمستخدمين والمعاملات
        console.log('🧹 جاري مسح المستخدمين والمعاملات القديمة...');
        await User.deleteMany({});
        await Transaction.deleteMany({});
        console.log('✅ تم تنظيف الجداول بنجاح.');

        // 2. توليد 22 مستخدم
        console.log('👥 جاري إنشاء 22 مستخدم وهمي مطابق للمواصفات...');
        const users = [];
        
        // كلمات مرور افتراضية (تُشفر بـ SHA-256 لمطابقة تطبيق الفلاتر)
        const defaultLoginPasswordHash = sha256('pass1234');
        const defaultBankPasswordHash = sha256('bank1234');
        const defaultPinHash = sha256('1234');

        for (let i = 0; i < 22; i++) {
            const template = userTemplates[i];
            
            const userId = `12${(i + 1).toString().padStart(10, '0')}`; // 12 رقم
            const accountNumber = `249${(i + 1).toString().padStart(5, '0')}`; // 8 أرقام
            const email = template.email;
            
            // رصيد ابتدائي عشوائي بين 50,000 و 800,000 جنيه سوداني
            const startingBalance = Math.floor(Math.random() * (800000 - 50000 + 1)) + 50000;
            
            // تاريخ ميلاد عشوائي بين 1980 و 2003
            const startBirth = new Date(1980, 0, 1);
            const endBirth = new Date(2003, 11, 31);
            const dateOfBirth = new Date(startBirth.getTime() + Math.random() * (endBirth.getTime() - startBirth.getTime()));

            const isPending = i >= 18; // آخر 4 حسابات تكون معلقة للمراجعة

            const user = new User({
                userId,
                accountNumber,
                email,
                loginPasswordHash: defaultLoginPasswordHash,
                passwordHash: defaultBankPasswordHash,
                pinHash: defaultPinHash,
                firstName: template.first,
                middleName: template.middle,
                lastName: template.last,
                dateOfBirth,
                idImagePath: `/assets/mock/id_card_${i + 1}.jpg`,
                balance: isPending ? 0 : startingBalance,
                deviceId: `device_mock_${(i + 1).toString().padStart(3, '0')}`,
                isActive: !isPending,
                userType: template.type,
                status: isPending ? 'pending' : 'approved'
            });

            users.push(user);
        }

        // حفظ المستخدمين
        await User.insertMany(users);
        console.log(`✅ تم إدراج 22 مستخدم بنجاح.`);

        // 3. توليد معاملات مالية وهمية (حوالي 45 معاملة) لجعل لوحة التحكم حية
        console.log('💸 جاري توليد المعاملات المالية الحية...');
        const transactions = [];
        const categories = ['transfer', 'electricity', 'telecom', 'deposit', 'withdrawal'];
        const paymentMethods = ['wallet', 'nfc', 'bank_card'];
        const statuses = ['completed', 'completed', 'completed', 'completed', 'failed', 'pending']; // أغلبها مكتملة

        for (let t = 0; t < 45; t++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            
            // اختيار مستخدم عشوائي كطرف رئيسي
            const userIndex1 = Math.floor(Math.random() * users.length);
            const user1 = users[userIndex1];
            
            let drAccount = '';
            let crAccount = '';
            let senderId = '';
            let senderName = '';
            let receiverId = '';
            let receiverName = '';
            
            const baseAmount = Math.floor(Math.random() * (15000 - 500 + 1)) + 500; // بين 500 و 15000 جنيه
            const systemFee = Math.floor(baseAmount * 0.01); // عمولة 1%
            const totalAmount = baseAmount + systemFee;
            
            if (category === 'deposit') {
                // إيداع: من حساب تسوية البنك إلى حساب المستخدم
                drAccount = 'SYS-SETTLE';
                crAccount = user1.userId;
                senderId = 'SYS-SETTLE';
                senderName = 'حساب التسويات البنكية';
                receiverId = user1.userId;
                receiverName = `${user1.firstName} ${user1.lastName}`;
                
                // تحديث الرصيد للمستخدم إذا كانت العملية ناجحة
                if (status === 'completed') {
                    user1.balance += baseAmount; 
                }
            } 
            else if (category === 'withdrawal') {
                // سحب: من حساب المستخدم إلى حساب التسويات أو الصراف
                drAccount = user1.userId;
                crAccount = 'SYS-SETTLE';
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = 'SYS-SETTLE';
                receiverName = 'حساب التسويات البنكية';
                
                // تحديث الرصيد للمستخدم إذا كانت العملية ناجحة
                if (status === 'completed' && user1.balance >= totalAmount) {
                    user1.balance -= totalAmount;
                }
            } 
            else if (category === 'electricity') {
                // كهرباء: دفع فاتورة
                drAccount = user1.userId;
                crAccount = 'SYS-ELEC';
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = 'SYS-ELEC';
                receiverName = 'حساب وسيط - الكهرباء';
                
                if (status === 'completed' && user1.balance >= totalAmount) {
                    user1.balance -= totalAmount;
                }
            } 
            else if (category === 'telecom') {
                // اتصالات: شحن رصيد زين أو سوداني
                const provider = Math.random() > 0.5 ? 'SYS-ZAIN' : 'SYS-SUDANI';
                const providerName = provider === 'SYS-ZAIN' ? 'حساب وسيط - زين' : 'حساب وسيط - سوداني';
                
                drAccount = user1.userId;
                crAccount = provider;
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = provider;
                receiverName = providerName;
                
                if (status === 'completed' && user1.balance >= totalAmount) {
                    user1.balance -= totalAmount;
                }
            } 
            else {
                // transfer: تحويل من مستخدم لمستخدم آخر
                let userIndex2 = Math.floor(Math.random() * users.length);
                while (userIndex2 === userIndex1) {
                    userIndex2 = Math.floor(Math.random() * users.length);
                }
                const user2 = users[userIndex2];
                
                drAccount = user1.userId;
                crAccount = user2.userId;
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = user2.userId;
                receiverName = `${user2.firstName} ${user2.lastName}`;
                
                if (status === 'completed' && user1.balance >= totalAmount) {
                    user1.balance -= totalAmount;
                    user2.balance += baseAmount; // المستلم يزيد بالـ baseAmount
                }
            }

            // تاريخ العملية عشوائي في آخر 15 يوماً
            const txDate = new Date();
            txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 15));
            txDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const tx = new Transaction({
                transactionId: `TX-${(100000 + t).toString()}`,
                drAccount,
                crAccount,
                senderId,
                senderName,
                receiverId,
                receiverName,
                baseAmount,
                systemFee,
                providerFee: 0,
                totalAmount,
                currency: 'SDG',
                type: senderId === user1.userId ? 'debit' : 'credit',
                category,
                status,
                paymentMethod,
                externalRef: `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
                note: `عملية وهمية ${category} بقيمة ${baseAmount} جنيه`,
                branchId: 'HEAD_QUARTERS',
                createdAt: txDate,
                updatedAt: txDate
            });

            transactions.push(tx);
        }

        // حفظ المعاملات وتحديث أرصدة المستخدمين في قاعدة البيانات
        await Transaction.insertMany(transactions);
        
        for (const u of users) {
            await User.updateOne({ _id: u._id }, { balance: u.balance });
        }
        
        console.log(`✅ تم إدراج 45 معاملة وهمية متناسقة محاسبياً بنجاح.`);
        console.log('🎉 تمت عملية تهيئة البيانات الوهمية بالكامل بنجاح!');

    } catch (error) {
        console.error('❌ حدث خطأ أثناء عملية التهيئة:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات.');
    }
}

seedData();
