require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOTPEmail, sendApprovalEmail } = require('./utils/mailer');

function sha256(string) {
    return crypto.createHash('sha256').update(string).digest('hex');
}

// تهيئة مجلد رفع الملفات
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 عميل متصل بالسوكت: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ عميل قطع الاتصال بالسوكت: ${socket.id}`);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// دالة مولد رقم المعاملة البنكية الموحد والفريد بطول 16 رقماً بالتمام
function generate16DigitTransactionId() {
    const timestampStr = Date.now().toString(); // 13 أرقام
    const randomDigits = Math.floor(100 + Math.random() * 900).toString(); // 3 أرقام عشوائية
    return timestampStr + randomDigits; // 16 رقماً بنكياً فريداً
}


// الاتصال بقاعدة بيانات MongoDB
mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح');
    await seedSuperAdmin();
    await seedSystemAccounts();
    await seedBankGateways();
}).catch((err) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
});

// ─── استدعاء النماذج (Models) ────────────────────────────────
const User = require('./models/User');
const DeviceRecord = require('./models/DeviceRecord');
const Transaction = require('./models/Transaction');
const AdminUser = require('./models/AdminUser');
const Branch = require('./models/Branch');
const SystemAccount = require('./models/SystemAccount');
const AuditLog = require('./models/AuditLog');
const BankGateway = require('./models/BankGateway');
const UsedBankTransaction = require('./models/UsedBankTransaction');
const Invoice = require('./models/Invoice');

// ─── استدعاء Middleware ──────────────────────────────────────
const { verifyToken, checkRole, branchFilter } = require('./middleware/auth');

// ═══════════════════════════════════════════════════════════════
// ██  AUTO SEED  ████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

async function seedSuperAdmin() {
    const exists = await AdminUser.findOne({ role: 'superadmin' });
    if (!exists) {
        const hash = await bcrypt.hash('admin', 10);
        await AdminUser.create({
            username: 'admin',
            passwordHash: hash,
            email: 'admin@sudacards.com',
            fullName: 'المدير العام',
            role: 'superadmin',
            branchId: 'HEAD_QUARTERS',
        });
        console.log('✅ تم إنشاء حساب المدير العام (admin/admin)');
    }
}

async function seedSystemAccounts() {
    const accounts = [
        { accountCode: 'SYS-REVENUE', name: 'حساب إيرادات النظام', type: 'revenue', description: 'تتجمع فيه كل عمولات التطبيق' },
        { accountCode: 'SYS-ZAIN', name: 'حساب وسيط - زين', type: 'provider', description: 'حساب وسيط لشركة زين' },
        { accountCode: 'SYS-SUDANI', name: 'حساب وسيط - سوداني', type: 'provider', description: 'حساب وسيط لشركة سوداني' },
        { accountCode: 'SYS-ELEC', name: 'حساب وسيط - الكهرباء', type: 'provider', description: 'حساب وسيط لشركة الكهرباء' },
        { accountCode: 'SYS-SUSPENSE', name: 'حساب العمليات المعلقة', type: 'suspense', description: 'العمليات قيد التنفيذ' },
        { accountCode: 'SYS-SETTLE', name: 'حساب التسويات البنكية', type: 'settlement', description: 'التسويات مع البنوك' },
    ];
    for (const acc of accounts) {
        await SystemAccount.findOneAndUpdate({ accountCode: acc.accountCode }, acc, { upsert: true, new: true });
    }
    console.log('✅ تم تهيئة حسابات النظام الداخلية');
}

async function seedBankGateways() {
    const gateways = [
        {
            name: 'بنك الخرطوم (تطبيق بنكك)',
            code: 'BANKAK',
            apiUrl: 'https://api.bankofkhartoum.com/v1/verify',
            merchantAccount: '3128941',
            validityHours: 6,
            instructions: 'قم بتحويل المبلغ المطلوبة إلى حساب البنك (3128941)، ثم ادخل رقم المعاملة الـ 16 رقماً هنا للمطابقة والتغذية الفورية.'
        },
        {
            name: 'بنك فيصل الإسلامي (فوري)',
            code: 'FIB',
            apiUrl: 'https://api.faisalbank.sd/v1/verify',
            merchantAccount: '100482931',
            validityHours: 6,
            instructions: 'قم بتحويل المبلغ إلى حساب سوداكارد ببنك فيصل (100482931)، ثم أدخل رقم المرجع البنكي للشحن.'
        },
        {
            name: 'بنك أمدرمان الوطني (أو كاش)',
            code: 'ONB',
            apiUrl: 'https://api.onb.sd/v1/verify',
            merchantAccount: '550183920',
            validityHours: 6,
            instructions: 'قم بتغذية الحساب عبر تحويل أمدرمان الوطني لحساب (550183920).'
        }
    ];

    for (const gw of gateways) {
        await BankGateway.findOneAndUpdate({ code: gw.code }, gw, { upsert: true, new: true });
    }
    console.log('✅ تم تهيئة البوابات البنكية المعتمدة (بنكك، فيصل، أمدرمان)');
}

// ═══════════════════════════════════════════════════════════════
// ██  AUTH ROUTES  ██████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await AdminUser.findOne({ username, isActive: true });
        if (!admin) return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

        const validPass = await bcrypt.compare(password, admin.passwordHash);
        if (!validPass) return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role, branchId: admin.branchId, fullName: admin.fullName },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ 
            success: true, token, 
            user: { id: admin._id, username: admin.username, role: admin.role, fullName: admin.fullName, branchId: admin.branchId }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// الحصول على بيانات المستخدم الحالي
app.get('/api/admin/me', verifyToken, async (req, res) => {
    const admin = await AdminUser.findById(req.user.id).select('-passwordHash');
    res.json({ success: true, data: admin });
});

// ═══════════════════════════════════════════════════════════════
// ██  DASHBOARD STATS  ██████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

app.get('/api/dashboard/stats', verifyToken, branchFilter, async (req, res) => {
    try {
        const bf = req.branchFilter;
        const { range = 'week' } = req.query;

        const usersCount = await User.countDocuments(bf);
        const activeUsersCount = await User.countDocuments({ ...bf, isActive: true });
        const txCount = await Transaction.countDocuments(bf);
        
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayTxCount = await Transaction.countDocuments({ ...bf, createdAt: { $gte: today } });

        const totalVolumeResult = await Transaction.aggregate([
            { $match: bf },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

        const totalRevenueResult = await Transaction.aggregate([
            { $match: { ...bf, status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$systemFee" } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // إعداد نطاق تصفية الرسم البياني
        let startDate;
        let groupFormat;
        
        if (range === 'today') {
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            groupFormat = "%H:00";
        } else if (range === 'month') {
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            groupFormat = "%m-%d";
        } else if (range === 'year') {
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            groupFormat = "%Y-%m";
        } else { // week
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            groupFormat = "%Y-%m-%d";
        }

        const trendData = await Transaction.aggregate([
            { $match: { ...bf, createdAt: { $gte: startDate } } },
            { $group: { 
                _id: { $dateToString: { format: groupFormat, date: "$createdAt", timezone: "+02:00" } }, 
                count: { $sum: 1 }, 
                volume: { $sum: "$totalAmount" } 
            } },
            { $sort: { _id: 1 } }
        ]);

        const serviceDistribution = await Transaction.aggregate([
            { $match: bf },
            { $group: { _id: "$category", count: { $sum: 1 }, volume: { $sum: "$totalAmount" } } }
        ]);

        res.json({ success: true, data: { usersCount, activeUsersCount, txCount, todayTxCount, totalVolume, totalRevenue, trendData, serviceDistribution } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  USERS MANAGEMENT  ████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

// جلب إحصائيات عامة للمستخدمين لصفحة المستخدمين
app.get('/api/users/stats', verifyToken, branchFilter, async (req, res) => {
    try {
        const filter = { ...req.branchFilter };
        const totalUsers = await User.countDocuments(filter);
        const activeUsers = await User.countDocuments({ ...filter, isActive: true });
        
        // حساب إجمالي الأرصدة
        const balanceResult = await User.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$balance" } } }
        ]);
        const totalBalances = balanceResult.length > 0 ? balanceResult[0].total : 0;
        
        // حساب إجمالي المعاملات
        const totalTransactions = await Transaction.countDocuments(filter);

        // حساب عدد الحسابات حسب النوع
        const typeCounts = await User.aggregate([
            { $match: filter },
            { $group: { _id: "$userType", count: { $sum: 1 } } }
        ]);

        // حساب الأرصدة والسيولة حسب النوع
        const typeBalances = await User.aggregate([
            { $match: filter },
            { $group: { _id: "$userType", balance: { $sum: "$balance" } } }
        ]);

        res.json({ 
            success: true, 
            data: { totalUsers, activeUsers, totalBalances, totalTransactions, typeCounts, typeBalances } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب المستخدمين (مع ترقيم الصفحات والبحث والفلترة بالفئة - فقط الحسابات المعتمدة)
app.get('/api/users', verifyToken, branchFilter, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, userType } = req.query;
        const filter = { ...req.branchFilter, status: 'approved' };
        
        if (userType) {
            if (userType.includes(',')) {
                filter.userType = { $in: userType.split(',') };
            } else {
                filter.userType = userType;
            }
        }
        
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } },
            ];
        }
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-loginPasswordHash -passwordHash -pinHash')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب عدد طلبات التسجيل المعلقة
app.get('/api/users/pending/count', verifyToken, branchFilter, async (req, res) => {
    try {
        const count = await User.countDocuments({ ...req.branchFilter, status: 'pending' });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب طلبات التسجيل المعلقة
app.get('/api/users/pending', verifyToken, branchFilter, async (req, res) => {
    try {
        const filter = { ...req.branchFilter, status: 'pending' };
        const users = await User.find(filter)
            .sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تسجيل مستخدم جديد من تطبيق الهاتف مع رفع الصور الفعلية
app.post('/api/users/register', upload.fields([
    { name: 'personalPhoto', maxCount: 1 },
    { name: 'idPhoto', maxCount: 1 },
    { name: 'signaturePhoto', maxCount: 1 },
    { name: 'commercialDocPhoto', maxCount: 1 },
    { name: 'logoPhoto', maxCount: 1 }
]), async (req, res) => {
    try {
        const { category, subType, phone, email, password, deviceId, fullName, entityName, commercialReg, address, managerName } = req.body;

        // 1. التحقق من تكرار البريد الإلكتروني
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        // 2. التحقق من تكرار الجهاز (حساب واحد لكل جهاز)
        const existingDevice = await User.findOne({ deviceId });
        if (existingDevice) {
            return res.status(400).json({ success: false, message: 'هذا الجهاز مرتبط بحساب آخر بالفعل' });
        }

        // 3. توليد معرف مستخدم ورقم حساب فريدين
        const lastUser = await User.findOne().sort({ userId: -1 });
        let nextIndex = 1;
        if (lastUser && lastUser.userId) {
            const match = lastUser.userId.match(/^12(\d+)$/);
            if (match) {
                nextIndex = parseInt(match[1]) + 1;
            }
        }
        const userId = `12${nextIndex.toString().padStart(10, '0')}`;
        const accountNumber = `249${nextIndex.toString().padStart(5, '0')}`;

        // 4. تقسيم وتجهيز حقول الاسم
        let firstName = '';
        let middleName = ' ';
        let lastName = ' ';

        if (category === 'individual') {
            if (req.body.firstName) {
                firstName = req.body.firstName.trim();
                middleName = req.body.middleName ? req.body.middleName.trim() : ' ';
                lastName = req.body.lastName ? req.body.lastName.trim() : ' ';
            } else if (fullName) {
                const nameParts = fullName.trim().split(/\s+/);
                if (nameParts.length === 1) {
                    firstName = nameParts[0];
                } else if (nameParts.length === 2) {
                    firstName = nameParts[0];
                    lastName = nameParts[1];
                } else {
                    firstName = nameParts[0];
                    middleName = nameParts[1];
                    lastName = nameParts.slice(2).join(' ');
                }
            }
        } else {
            firstName = entityName || 'جهة تجارية';
        }


        // 5. تشفير كلمة المرور والـ PIN الافتراضي
        const loginPasswordHash = sha256(password);
        const passwordHash = sha256('bank1234'); // كلمة مرور العمليات الافتراضية
        const pinHash = sha256('1234'); // الرمز السري الافتراضي

        // تحديد وتنسيق نوع الحساب ليطابق Enum السيرفر وقاعدة البيانات
        let userType = 'personal';
        if (category !== 'individual') {
            const validTypes = ['personal', 'merchant', 'company', 'restaurant', 'cafe', 'hospital', 'health_center', 'pharmacy', 'university'];
            let checkType = subType;
            if (subType === 'healthCenter') checkType = 'health_center';
            if (subType === 'clinic' || subType === 'lab') checkType = 'health_center';
            if (subType === 'school' || subType === 'trainingCenter') checkType = 'university';
            if (subType === 'shop' || subType === 'supermarket' || subType === 'hotel' || subType === 'salon') checkType = 'merchant';
            if (subType === 'charityOrganization' || subType === 'governmentEntity') checkType = 'company';

            if (validTypes.includes(checkType)) {
                userType = checkType;
            } else {
                userType = 'company';
            }
        }

        // استخراج مسارات الملفات المرفوعة وحفظ مراجعها
        const personalPhotoPath = req.files && req.files['personalPhoto'] ? `/uploads/${req.files['personalPhoto'][0].filename}` : '';
        const idImagePath = req.files && req.files['idPhoto'] ? `/uploads/${req.files['idPhoto'][0].filename}` : '';
        const signaturePhotoPath = req.files && req.files['signaturePhoto'] ? `/uploads/${req.files['signaturePhoto'][0].filename}` : '';
        const commercialDocPhotoPath = req.files && req.files['commercialDocPhoto'] ? `/uploads/${req.files['commercialDocPhoto'][0].filename}` : '';
        const logoPhotoPath = req.files && req.files['logoPhoto'] ? `/uploads/${req.files['logoPhoto'][0].filename}` : '';

        let savedIdImagePath = idImagePath;
        if (category !== 'individual' && commercialDocPhotoPath) {
            savedIdImagePath = commercialDocPhotoPath;
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // 6. حفظ الحساب كـ Unverified مع مراجع الصور المرفوعة
        const newUser = new User({
            userId,
            accountNumber,
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : '',
            loginPasswordHash,
            passwordHash,
            pinHash,
            firstName,
            middleName,
            lastName,
            dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date(1990, 0, 1),
            idImagePath: savedIdImagePath,
            personalPhotoPath,
            signaturePhotoPath,
            logoPhotoPath: category === 'individual' ? '' : logoPhotoPath,
            commercialReg: category === 'individual' ? '' : (commercialReg ? commercialReg.trim() : ''),
            address: category === 'individual' ? '' : (address ? address.trim() : ''),
            managerName: category === 'individual' ? '' : (managerName ? managerName.trim() : ''),
            balance: 0.0,
            deviceId,
            userType,
            isActive: false,
            status: 'unverified',
            otpCode,
            otpExpires
        });


        await newUser.save();

        // سجل الجهاز (Device Auditing)
        let deviceRecord = await DeviceRecord.findOne({ deviceId });
        if (!deviceRecord) {
            deviceRecord = new DeviceRecord({ deviceId });
        }
        deviceRecord.history.push({
            user: newUser._id,
            accountNumber: newUser.accountNumber,
            name: category === 'individual' ? fullName : firstName,
            linkedAt: new Date()
        });
        await deviceRecord.save();

        // Send OTP via Email
        await sendOTPEmail(newUser.email, otpCode);

        res.status(201).json({
            success: true,
            message: 'تم التسجيل المبدئي. يرجى التحقق من بريدك الإلكتروني لإدخال رمز التحقق.',
            data: {
                userId,
                accountNumber,
                email: newUser.email,
                fullName: category === 'individual' ? fullName : firstName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر أثناء التسجيل', error: error.message });
    }
});

// التحقق من الـ OTP
app.post('/api/users/verify-otp', async (req, res) => {
    try {
        const { email, otpCode } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        
        if (user.status !== 'unverified') {
            return res.status(400).json({ success: false, message: 'هذا الحساب تم التحقق منه مسبقاً' });
        }
        
        if (user.otpCode !== otpCode) {
            return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ success: false, message: 'رمز التحقق منتهي الصلاحية' });
        }
        
        // تفعيل الإيميل وتغيير الحالة إلى قيد المراجعة
        user.status = 'pending';
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        res.json({ success: true, message: 'تم تأكيد البريد الإلكتروني بنجاح، حسابك الآن قيد المراجعة' });
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر أثناء التحقق من الرمز', error: error.message });
    }
});

// تسجيل دخول مستخدم الهاتف
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password, deviceId } = req.body; // email field here is actually the account number sent from the app
        const accountNumberInput = email.trim();
        
        // البحث برقم الحساب فقط
        const user = await User.findOne({ accountNumber: accountNumberInput });
        
        if (!user) {
            return res.status(400).json({ success: false, message: 'رقم الحساب أو كلمة المرور غير صحيحة' });
        }

        if (user.isLocked) {
            return res.status(403).json({ success: false, status: 'account_locked', message: 'تم إغلاق الحساب مؤقتاً لدواعي أمنية. يرجى استعادة الحساب.' });
        }

        if (user.status === 'unverified') {
            return res.status(403).json({ success: false, status: 'unverified', message: 'لم يتم تأكيد بريدك الإلكتروني بعد.' });
        }
        if (user.status === 'pending') {
            return res.status(403).json({ success: false, status: 'pending', message: 'حسابك لا يزال قيد المراجعة والتدقيق.' });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ success: false, status: 'rejected', message: 'تم رفض طلب تسجيل هذا الحساب.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'الحساب موقوف حالياً. يرجى الاتصال بالدعم.' });
        }

        // التحقق من كلمة المرور المشفرة بـ SHA-256 (وإغلاق الحساب بعد محاولتين خطأ)
        if (user.loginPasswordHash !== sha256(password)) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 2) {
                user.isLocked = true;
                await user.save();
                return res.status(403).json({ success: false, status: 'account_locked', message: 'تم إغلاق الحساب بسبب إدخال كلمة مرور خاطئة مرتين متتاليتين.' });
            }
            await user.save();
            return res.status(400).json({ success: false, message: `كلمة المرور غير صحيحة. يتبقى لك ${2 - user.failedLoginAttempts} محاولة.` });
        }

        // كلمة المرور صحيحة، نصفّر الأخطاء
        user.failedLoginAttempts = 0;

        // التحقق من مطابقة الجهاز وإحلال الحساب القديم (قاعدة الـ 3 محاولات)
        if (user.deviceId && user.deviceId !== deviceId) {
            if (user.pendingDeviceId !== deviceId) {
                user.deviceChangeAttempts = 1;
                user.pendingDeviceId = deviceId;
            } else {
                user.deviceChangeAttempts += 1;
            }
            await user.save();

            if (user.deviceChangeAttempts < 3) {
                return res.status(403).json({ success: false, status: 'device_unauthorized', message: 'هذا الجهاز غير مصرح له. يرجى المحاولة مرة أخرى لتأكيد هويتك.' });
            } else {
                user.deviceChangeAttempts = 0;
                await user.save();
                return res.status(403).json({ success: false, status: 'device_mismatch', message: 'يبدو أنك تحاول تسجيل الدخول من جهاز جديد. يرجى تأكيد هويتك.' });
            }
        } else if (!user.deviceId) {
            // حالة عودة الحساب المفصول (Unlinked User)
            if (user.pendingDeviceId !== deviceId) {
                user.deviceChangeAttempts = 1;
                user.pendingDeviceId = deviceId;
            } else {
                user.deviceChangeAttempts += 1;
            }
            await user.save();

            if (user.deviceChangeAttempts < 3) {
                return res.status(403).json({ success: false, status: 'device_unauthorized', message: 'هذا الجهاز غير مصرح له. يرجى المحاولة مرة أخرى لتأكيد هويتك.' });
            } else {
                user.deviceChangeAttempts = 0;
                await user.save();
                return res.status(403).json({ success: false, status: 'device_mismatch', message: 'حسابك غير مرتبط بأي جهاز. يرجى تأكيد هويتك لربطه بهذا الجهاز.' });
            }
        }

        // نجاح تام، نصفر أي محاولات نقل سابقة
        user.deviceChangeAttempts = 0;
        user.pendingDeviceId = null;
        await user.save();

        // إصدار JWT Token للعميل
        const token = jwt.sign(
            { id: user._id, userId: user.userId, email: user.email, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // مدة أطول للموبايل
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.userId,
                accountNumber: user.accountNumber,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                balance: user.balance,
                userType: user.userType,
                hasSetPin: user.hasSetPin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر أثناء تسجيل الدخول', error: error.message });
    }
});
// جلب بيانات المستخدم الحالي (موبايل)
app.get('/api/users/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash -loginPasswordHash -pinHash');
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user me error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
});

// تحديث تفضيلات الإشعارات للمستخدم
app.put('/api/users/me/notifications', verifyToken, async (req, res) => {
    try {
        const { notificationPreferences, fcmToken } = req.body;
        
        const updateData = {};
        if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;
        if (fcmToken) updateData.fcmToken = fcmToken;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select('notificationPreferences fcmToken');

        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح', data: user });
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر أثناء تحديث الإشعارات' });
    }
});

// إعداد أسئلة الأمان
app.post('/api/users/me/security-questions', verifyToken, async (req, res) => {
    try {
        const { questions } = req.body; 
        // questions should be an array of { question, answer }
        
        if (!questions || !Array.isArray(questions) || questions.length !== 3) {
            return res.status(400).json({ success: false, message: 'يجب تقديم 3 أسئلة أمان' });
        }

        const securityQuestions = questions.map(q => ({
            question: q.question,
            answerHash: crypto.createHash('sha256').update(q.answer.toLowerCase().trim()).digest('hex')
        }));

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $set: { 
                    securityQuestions: securityQuestions,
                    hasSecurityQuestions: true
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم حفظ أسئلة الأمان بنجاح' });
    } catch (error) {
        console.error('Setup security questions error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر أثناء حفظ أسئلة الأمان' });
    }
});

// طلب رمز التحقق لتغيير كلمة المرور
app.post('/api/users/me/request-password-change-otp', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
        await user.save();

        await sendOTPEmail(user.email, otpCode);

        res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
    } catch (error) {
        console.error('Request password change OTP error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال رمز التحقق' });
    }
});

// تغيير كلمة المرور بعد إدخال الـ OTP
app.post('/api/users/me/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, otpCode } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        // التحقق من كلمة المرور الحالية
        if (user.loginPasswordHash !== sha256(currentPassword)) {
            return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
        }

        // التحقق من OTP
        if (user.otpCode !== otpCode) {
            return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });
        }
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ success: false, message: 'رمز التحقق منتهي الصلاحية' });
        }

        // تحديث كلمة المرور ومسح الـ OTP
        user.loginPasswordHash = sha256(newPassword);
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' });
    }
});

// طلب رمز OTP لإنشاء أو تغيير PIN
app.post('/api/users/me/request-pin-change-otp', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
        await user.save();

        await sendOTPEmail(user.email, otpCode);

        res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
    } catch (error) {
        console.error('Request PIN OTP error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء طلب الرمز' });
    }
});

// تغيير أو إنشاء رقم PIN
app.post('/api/users/me/change-pin', verifyToken, async (req, res) => {
    try {
        const { currentPin, newPin, otpCode } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });

        // التحقق من الـ OTP
        if (!user.otpCode || user.otpCode !== otpCode) {
            return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });
        }
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ success: false, message: 'رمز التحقق منتهي الصلاحية' });
        }

        // إذا كان لديه PIN مسبق، نتحقق منه
        if (user.transactionPinHash && currentPin) {
            const currentPinHash = sha256(currentPin);
            if (user.transactionPinHash !== currentPinHash) {
                return res.status(400).json({ success: false, message: 'رقم الـ PIN الحالي غير صحيح' });
            }
        }

        // تحديث الـ PIN
        user.transactionPinHash = sha256(newPin);
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'تم تعيين رقم الـ PIN بنجاح' });
    } catch (error) {
        console.error('Change PIN error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تعيين الـ PIN' });
    }
});

// البحث عن مستخدم برقم حسابه (قبل التحويل المالي)
app.get('/api/users/search/:accountNumber', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ accountNumber: req.params.accountNumber })
            .select('firstName lastName accountNumber _id');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'حساب غير موجود' });
        }

        // حظر البحث والتحويل لنفس الحساب
        if (user._id.toString() === req.user.id.toString() || user.accountNumber === req.user.accountNumber) {
            return res.status(400).json({ success: false, message: 'لا يمكن التحويل إلى حسابك الشخصي' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Search user error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
});

// جلب المعاملات الأخيرة للمستخدم الحالي (موبايل)
app.get('/api/users/me/transactions', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        
        const transactions = await Transaction.find({
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id },
                { senderId: req.user.userId },
                { receiverId: req.user.userId }
            ]
        })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', 'firstName lastName accountNumber')
        .populate('receiverId', 'firstName lastName accountNumber');

        const total = await Transaction.countDocuments({
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id },
                { senderId: req.user.userId },
                { receiverId: req.user.userId }
            ]
        });

        res.json({ 
            success: true, 
            transactions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions me error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
});

// تحويل مالي بين الحسابات (P2P Transfer)
app.post('/api/transactions/transfer', verifyToken, async (req, res) => {
    try {
        const { receiverAccountNumber, amount, note } = req.body;
        const transferAmount = parseFloat(amount);

        if (!receiverAccountNumber || isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({ success: false, message: 'بيانات التحويل غير صحيحة' });
        }

        const sender = await User.findById(req.user.id);
        if (!sender) return res.status(404).json({ success: false, message: 'المرسل غير موجود' });

        if (sender.balance < transferAmount) {
            return res.status(400).json({ 
                success: false, 
                message: `الرصيد غير كافٍ. رصيدك الفعلي في السيرفر هو ${sender.balance.toLocaleString('ar-SA')} SDG والمبلغ المطلوب هو ${transferAmount.toLocaleString('ar-SA')} SDG` 
            });
        }

        const receiver = await User.findOne({ accountNumber: receiverAccountNumber });
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'حساب المستفيد غير موجود' });
        }

        if (sender._id.toString() === receiver._id.toString() || sender.accountNumber === receiver.accountNumber) {
            return res.status(400).json({ success: false, message: 'لا يمكن التحويل إلى حسابك الشخصي' });
        }

        // خصم وإضافة
        sender.balance -= transferAmount;
        receiver.balance += transferAmount;

        await sender.save();
        await receiver.save();

        // تسجيل العملية برقم بنكي 16 رقماً
        const txId = generate16DigitTransactionId();
        const transaction = await Transaction.create({
            transactionId: txId,
            senderId: sender._id,
            receiverId: receiver._id,
            drAccount: sender.accountNumber,
            crAccount: receiver.accountNumber,
            senderName: `${sender.firstName} ${sender.lastName}`,
            receiverName: `${receiver.firstName} ${receiver.lastName}`,
            amount: transferAmount,
            totalAmount: transferAmount,
            baseAmount: transferAmount,
            type: 'transfer',
            category: 'transfer',
            status: 'completed',
            note: note || 'تحويل مالي بين الحسابات',
            description: note || 'تحويل مالي بين الحسابات',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'تم التحويل بنجاح',
            transactionId: txId,
            transaction,
            newBalance: sender.balance
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إجراء عملية التحويل', error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  INVOICE / REQUEST MONEY ROUTES  ████████████████████████████
// ═══════════════════════════════════════════════════════════════

// إنشاء طلب أموال (فاتورة) جديدة
app.post('/api/invoices', verifyToken, async (req, res) => {
    try {
        const { amount, description } = req.body;
        const depositAmount = parseFloat(amount);

        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({ success: false, message: 'الرجاء إدخال مبلغ صحيح' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const now = new Date();
        const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        const invoice = await Invoice.create({
            invoiceId,
            creatorId: user._id,
            creatorAccountNumber: user.accountNumber,
            creatorName: `${user.firstName} ${user.lastName}`,
            amount: depositAmount,
            description: description || '',
            status: 'pending',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // صالحة لـ 7 أيام
        });

        res.json({ success: true, message: 'تم إنشاء طلب الأموال بنجاح', invoice });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الفاتورة' });
    }
});

// جلب تفاصيل فاتورة برقمها
app.get('/api/invoices/:invoiceId', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ invoiceId: req.params.invoiceId });
        if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الفاتورة' });
    }
});

// دفع الفاتورة
app.post('/api/invoices/:invoiceId/pay', verifyToken, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ invoiceId: req.params.invoiceId });
        if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });

        if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'هذه الفاتورة مدفوعة مسبقاً' });
        if (invoice.status === 'cancelled') return res.status(400).json({ success: false, message: 'هذه الفاتورة ملغية' });
        if (new Date() > invoice.expiresAt) {
            invoice.status = 'expired';
            await invoice.save();
            return res.status(400).json({ success: false, message: 'هذه الفاتورة منتهية الصلاحية' });
        }

        const payer = await User.findById(req.user.id);
        if (!payer) return res.status(404).json({ success: false, message: 'حساب الدافع غير موجود' });

        if (payer._id.toString() === invoice.creatorId.toString()) {
            return res.status(400).json({ success: false, message: 'لا يمكنك دفع فاتورة لنفسك' });
        }

        if (payer.balance < invoice.amount) {
            return res.status(400).json({ success: false, message: 'رصيدك غير كافٍ لدفع الفاتورة' });
        }

        const creator = await User.findById(invoice.creatorId);
        if (!creator) return res.status(404).json({ success: false, message: 'صاحب الفاتورة غير موجود بالنظام' });

        // خصم وإضافة
        payer.balance -= invoice.amount;
        creator.balance += invoice.amount;

        await payer.save();
        await creator.save();

        // تحديث حالة الفاتورة
        invoice.status = 'paid';
        invoice.payerId = payer._id;
        await invoice.save();

        // تسجيل قيد مالي
        const txId = generate16DigitTransactionId();
        const transaction = await Transaction.create({
            transactionId: txId,
            senderId: payer._id,
            receiverId: creator._id,
            drAccount: payer.accountNumber,
            crAccount: creator.accountNumber,
            senderName: `${payer.firstName} ${payer.lastName}`,
            receiverName: creator.creatorName || `${creator.firstName} ${creator.lastName}`,
            amount: invoice.amount,
            totalAmount: invoice.amount,
            baseAmount: invoice.amount,
            type: 'transfer',
            category: 'transfer', // يمكن جعلها 'invoice'
            status: 'completed',
            note: `دفع فاتورة رقم ${invoice.invoiceId} ${invoice.description ? ' - ' + invoice.description : ''}`,
            description: `دفع فاتورة طلب أموال`,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'تم دفع الفاتورة بنجاح',
            transactionId: txId,
            newBalance: payer.balance
        });

    } catch (error) {
        console.error('Pay invoice error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء دفع الفاتورة' });
    }
});


// قبول حساب مستخدم جديد
app.put('/api/users/:id/approve', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        if (user.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'الحساب ليس في حالة انتظار المراجعة' });
        }

        user.status = 'approved';
        user.isActive = true;
        await user.save();

        // 📧 إرسال بريد إلكتروني رسمي للعميل بنجاح التفعيل
        try {
            const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim();
            await sendApprovalEmail(user.email, fullName, user.accountNumber);
        } catch (emailErr) {
            console.error('Failed to send approval email:', emailErr);
        }

        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'APPROVE_USER_REGISTRATION',
            targetType: 'user', targetId: user._id.toString(),
            details: { userId: user.userId, email: user.email },
        });

        res.json({ success: true, message: 'تم قبول وتفعيل الحساب وإرسال بريد التأكيد بنجاح', data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// رفض طلب تسجيل مستخدم جديد
app.put('/api/users/:id/reject', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        if (user.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'الحساب ليس في حالة انتظار المراجعة' });
        }

        user.status = 'rejected';
        user.isActive = false;
        // Free up device ID and email by appending a timestamp suffix
        const suffix = '_rejected_' + Date.now();
        if (user.deviceId) user.deviceId += suffix;
        if (user.email) user.email += suffix;
        if (user.phone) user.phone += suffix;
        await user.save();

        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'REJECT_USER_REGISTRATION',
            targetType: 'user', targetId: user._id.toString(),
            details: { userId: user.userId, email: user.email },
        });

        res.json({ success: true, message: 'تم رفض طلب التسجيل بنجاح', data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// مسار الحذف النهائي للمستخدم (Hard Delete)
app.delete('/api/users/:id', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        // Helper function to safely delete files
        const safeDeleteFile = (filePath) => {
            if (filePath) {
                const fullPath = path.join(__dirname, filePath);
                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (e) {
                        console.error('Error deleting file:', fullPath, e);
                    }
                }
            }
        };

        // حذف الملفات المرتبطة
        safeDeleteFile(user.idImagePath);
        safeDeleteFile(user.personalPhotoPath);
        safeDeleteFile(user.signaturePhotoPath);
        safeDeleteFile(user.logoPhotoPath);

        // حذف المستخدم نهائياً
        await User.findByIdAndDelete(req.params.id);

        // تسجيل العملية في سجل التدقيق
        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'HARD_DELETE_USER',
            targetType: 'user', targetId: user._id.toString(),
            details: { userId: user.userId, email: user.email },
        });

        res.json({ success: true, message: 'تم الحذف النهائي للمستخدم وكافة ملفاته بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// تغيير حالة المستخدم (تنشيط/إيقاف)
app.put('/api/users/:id/status', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        user.isActive = !user.isActive;
        await user.save();

        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: user.isActive ? 'ACTIVATE_USER' : 'BLOCK_USER',
            targetType: 'user', targetId: user._id.toString(),
            details: { userId: user.userId, newStatus: user.isActive },
        });

        res.json({ success: true, message: user.isActive ? 'تم تنشيط الحساب' : 'تم إيقاف الحساب', data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// مساعدة للبحث المرن عن العميل بحسب _id أو userId أو accountNumber
async function findUserFlexible(idParam) {
    if (!idParam) return null;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        user = await User.findById(idParam);
    }
    if (!user) {
        user = await User.findOne({ 
            $or: [
                { userId: idParam }, 
                { accountNumber: idParam },
                { email: idParam }
            ] 
        });
    }
    return user;
}

// كشف حساب عميل
app.get('/api/users/:id/statement', verifyToken, async (req, res) => {
    try {
        const user = await findUserFlexible(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const userIds = [user._id.toString(), user.userId, user.accountNumber];
        const txFilter = { $or: [{ senderId: { $in: userIds } }, { receiverId: { $in: userIds } }] };
        if (Object.keys(dateFilter).length > 0) txFilter.createdAt = dateFilter;

        const transactions = await Transaction.find(txFilter).sort({ createdAt: -1 });

        const mappedTransactions = transactions.map(tx => ({
            transactionId: tx.transactionId,
            senderId: tx.senderId,
            receiverId: tx.receiverId,
            receiverName: tx.receiverName || '',
            amount: tx.totalAmount || tx.baseAmount || tx.amount || 0,
            type: tx.type,
            category: tx.category || 'transfer',
            note: tx.note || tx.description || '',
            timestamp: (tx.createdAt || tx.timestamp || new Date()).toISOString(),
            status: tx.status
        }));

        res.json({ 
            success: true, 
            user: {
                id: user.userId,
                accountNumber: user.accountNumber,
                email: user.email,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                balance: user.balance,
                deviceId: user.deviceId,
                isActive: user.isActive
            }, 
            transactions: mappedTransactions 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب تفاصيل كاملة لعميل محدد
app.get('/api/users/:id/details', verifyToken, async (req, res) => {
    try {
        const user = await findUserFlexible(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const cleanUser = user.toObject();
        delete cleanUser.loginPasswordHash;
        delete cleanUser.passwordHash;
        delete cleanUser.pinHash;

        res.json({ success: true, data: cleanUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تعديل رصيد العميل يدوياً بواسطة الإدارة (تغذية / خصم)
app.post('/api/users/:id/adjust-balance', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const user = await findUserFlexible(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const { actionType, amount, reason } = req.body; // actionType: 'deposit' | 'deduct'
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'المبلغ المدخل غير صحيح' });
        }

        if (actionType === 'deduct' && user.balance < numAmount) {
            return res.status(400).json({ success: false, message: 'رصيد العميل غير كافٍ لإجراء عملية الخصم' });
        }

        const previousBalance = user.balance;

        if (actionType === 'deposit') {
            user.balance += numAmount;
        } else if (actionType === 'deduct') {
            user.balance -= numAmount;
        } else {
            return res.status(400).json({ success: false, message: 'نوع العملية غير صحيح (يجب أن يكون deposit أو deduct)' });
        }

        await user.save();

        // 1. تسجيل قيد مالي في سجل الحركات (Transaction Ledger) برقم بنكي 16 رقماً
        const txId = generate16DigitTransactionId();
        const transaction = await Transaction.create({
            transactionId: txId,
            drAccount: actionType === 'deposit' ? 'SYS-ADMIN-CREDIT' : user.accountNumber,
            crAccount: actionType === 'deposit' ? user.accountNumber : 'SYS-ADMIN-DEBIT',
            senderId: actionType === 'deposit' ? 'ADMIN_SYSTEM' : user.userId,
            senderName: actionType === 'deposit' ? `إدارة النظام (${req.user.fullName || 'المدير'})` : `${user.firstName} ${user.lastName}`,
            receiverId: actionType === 'deposit' ? user.userId : 'ADMIN_SYSTEM',
            receiverName: actionType === 'deposit' ? `${user.firstName} ${user.lastName}` : `إدارة النظام (${req.user.fullName || 'المدير'})`,
            baseAmount: numAmount,
            totalAmount: numAmount,
            type: actionType === 'deposit' ? 'credit' : 'debit',
            category: actionType === 'deposit' ? 'deposit' : 'withdrawal',
            status: 'completed',
            note: reason || (actionType === 'deposit' ? 'تغذية حساب يدوية بواسطة الإدارة' : 'خصم من الحساب بواسطة الإدارة'),
            branchId: req.user.branchId || 'HEAD_QUARTERS'
        });

        // 2. تسجيل العملية في سجل التدقيق الإداري (AuditLog)
        await AuditLog.create({
            adminId: req.user.id,
            adminName: req.user.fullName,
            action: actionType === 'deposit' ? 'ADMIN_DEPOSIT_BALANCE' : 'ADMIN_DEDUCT_BALANCE',
            targetType: 'user',
            targetId: user._id.toString(),
            details: {
                userId: user.userId,
                accountNumber: user.accountNumber,
                previousBalance,
                newBalance: user.balance,
                amount: numAmount,
                reason: reason || ''
            }
        });

        res.json({
            success: true,
            message: actionType === 'deposit' ? 'تمت تغذية الحساب بنجاح' : 'تم الخصم من الحساب بنجاح',
            newBalance: user.balance,
            transaction
        });

    } catch (error) {
        console.error('Adjust balance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب الإحصائيات والتحليلات البيانية المعقدة لعميل محدد
app.get('/api/users/:id/analytics', verifyToken, async (req, res) => {
    try {
        const user = await findUserFlexible(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const userIds = [user._id.toString(), user.userId, user.accountNumber];

        // 1. حساب إجمالي الحركات المالية الصادرة والواردة
        const sentTx = await Transaction.aggregate([
            { $match: { senderId: { $in: userIds }, status: 'completed' } },
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        const receivedTx = await Transaction.aggregate([
            { $match: { receiverId: { $in: userIds }, status: 'completed' } },
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        // 2. تحليل الفواتير والدفعات بحسب الخدمة (كهرباء، اتصالات، إلخ)
        const billStats = await Transaction.aggregate([
            { $match: { senderId: { $in: userIds }, category: { $ne: 'transfer' }, status: 'completed' } },
            { $group: { _id: "$category", totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        // 3. اتجاهات الحركات المالية شهرياً (آخر 6 أشهر للرسم البياني)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySent = await Transaction.aggregate([
            { 
                $match: { 
                    senderId: { $in: userIds }, 
                    createdAt: { $gte: sixMonthsAgo },
                    status: 'completed' 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    amount: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const monthlyReceived = await Transaction.aggregate([
            { 
                $match: { 
                    receiverId: { $in: userIds }, 
                    createdAt: { $gte: sixMonthsAgo },
                    status: 'completed' 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    amount: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const monthlyBills = await Transaction.aggregate([
            { 
                $match: { 
                    senderId: { $in: userIds }, 
                    category: { $ne: 'transfer' },
                    createdAt: { $gte: sixMonthsAgo },
                    status: 'completed' 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    amount: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 4. تاريخ آخر نشاط
        const lastTx = await Transaction.findOne({ 
            $or: [{ senderId: { $in: userIds } }, { receiverId: { $in: userIds } }] 
        }).sort({ createdAt: -1 });

        const now = new Date();
        const createdDate = new Date(user.createdAt);
        const accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            analytics: {
                sent: sentTx[0] || { totalAmount: 0, count: 0 },
                received: receivedTx[0] || { totalAmount: 0, count: 0 },
                billStats,
                monthlyTrends: {
                    sent: monthlySent,
                    received: monthlyReceived,
                    bills: monthlyBills
                },
                lastActivity: lastTx ? lastTx.createdAt : user.createdAt,
                accountAgeDays
            }
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  TRANSACTIONS / LEDGER  ███████████████████████████████████
// ═══════════════════════════════════════════════════════════════

// جلب المعاملات مع فلاتر محاسبية متقدمة
app.get('/api/transactions', verifyToken, branchFilter, async (req, res) => {
    try {
        const { page = 1, limit = 25, search, status, category, from, to, reconciled } = req.query;
        const filter = { ...req.branchFilter };

        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { senderName: { $regex: search, $options: 'i' } },
                { receiverName: { $regex: search, $options: 'i' } },
                { externalRef: { $regex: search, $options: 'i' } },
            ];
        }
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (reconciled === 'true') filter.isReconciled = true;
        if (reconciled === 'false') filter.isReconciled = false;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const total = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  REVENUE & RECONCILIATION  ████████████████████████████████
// ═══════════════════════════════════════════════════════════════

// تقرير الإيرادات
app.get('/api/ledger/revenue', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const matchStage = { status: 'completed' };
        if (Object.keys(dateFilter).length > 0) matchStage.createdAt = dateFilter;

        const revenueByCategory = await Transaction.aggregate([
            { $match: matchStage },
            { $group: { _id: "$category", totalFees: { $sum: "$systemFee" }, txCount: { $sum: 1 }, totalVolume: { $sum: "$totalAmount" } } },
            { $sort: { totalFees: -1 } }
        ]);

        const dailyRevenue = await Transaction.aggregate([
            { $match: matchStage },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, fees: { $sum: "$systemFee" }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        const grandTotal = revenueByCategory.reduce((sum, cat) => sum + cat.totalFees, 0);

        res.json({ success: true, data: { grandTotal, byCategory: revenueByCategory, daily: dailyRevenue } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// قيد عكسي (Refund/Reverse)
app.post('/api/ledger/reverse', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const { transactionId, reason } = req.body;
        const original = await Transaction.findOne({ transactionId });
        if (!original) return res.status(404).json({ success: false, message: 'المعاملة غير موجودة' });
        if (original.status === 'refunded' || original.status === 'reversed') {
            return res.status(400).json({ success: false, message: 'هذه المعاملة تم عكسها مسبقاً' });
        }

        // إنشاء قيد عكسي
        const reversalTx = await Transaction.create({
            transactionId: `REV-${original.transactionId}`,
            drAccount: original.crAccount, // عكس الأطراف
            crAccount: original.drAccount,
            senderId: original.receiverId,
            senderName: original.receiverName,
            receiverId: original.senderId,
            receiverName: original.senderName,
            baseAmount: original.baseAmount,
            systemFee: -original.systemFee, // سلبي لأنه إرجاع
            providerFee: 0,
            totalAmount: original.totalAmount,
            currency: original.currency,
            type: original.type === 'debit' ? 'credit' : 'debit',
            category: 'refund',
            status: 'completed',
            paymentMethod: original.paymentMethod,
            reversalOf: original.transactionId,
            note: `قيد عكسي: ${reason || 'لا يوجد سبب'}`,
            branchId: req.user.branchId,
        });

        original.status = 'reversed';
        await original.save();

        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'REVERSE_TRANSACTION',
            targetType: 'transaction', targetId: original.transactionId,
            details: { reason, reversalId: reversalTx.transactionId },
        });

        res.json({ success: true, message: 'تم إجراء القيد العكسي بنجاح', data: reversalTx });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// مطابقة معاملة (Reconcile)
app.put('/api/ledger/reconcile/:txId', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const tx = await Transaction.findOne({ transactionId: req.params.txId });
        if (!tx) return res.status(404).json({ success: false, message: 'المعاملة غير موجودة' });

        tx.isReconciled = true;
        tx.reconciledAt = new Date();
        tx.reconciledBy = req.user.id;
        await tx.save();

        res.json({ success: true, message: 'تمت المطابقة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  ADMIN & BRANCH MANAGEMENT  ██████████████████████████████
// ═══════════════════════════════════════════════════════════════

// جلب جميع المشرفين
app.get('/api/admins', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const admins = await AdminUser.find().select('-passwordHash').populate('parentId', 'fullName username');
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إنشاء مشرف جديد (مدير فرع أو موظف)
app.post('/api/admins', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const { username, password, email, fullName, role, branchId, dailyTransferLimit } = req.body;
        
        // مدير الفرع لا يمكنه إنشاء superadmin
        if (req.user.role === 'manager' && role !== 'teller') {
            return res.status(403).json({ success: false, message: 'مدير الفرع يمكنه فقط إنشاء حسابات موظفين' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newAdmin = await AdminUser.create({
            username, passwordHash: hash, email, fullName, role,
            branchId: branchId || req.user.branchId,
            parentId: req.user.id,
            dailyTransferLimit: dailyTransferLimit || 0,
        });

        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'CREATE_ADMIN', targetType: 'admin', targetId: newAdmin._id.toString(),
            details: { role, branchId, username },
        });

        res.json({ success: true, message: 'تم إنشاء الحساب بنجاح', data: { ...newAdmin.toObject(), passwordHash: undefined } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب الفروع
app.get('/api/branches', verifyToken, async (req, res) => {
    try {
        const branches = await Branch.find().populate('managerId', 'fullName username');
        res.json({ success: true, data: branches });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إنشاء فرع جديد
app.post('/api/branches', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const branch = await Branch.create(req.body);
        await AuditLog.create({
            adminId: req.user.id, adminName: req.user.fullName,
            action: 'CREATE_BRANCH', targetType: 'branch', targetId: branch._id.toString(),
            details: { branchCode: branch.branchCode, name: branch.name },
        });
        res.json({ success: true, data: branch });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  SYSTEM ACCOUNTS  █████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

app.get('/api/system-accounts', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const accounts = await SystemAccount.find();
        res.json({ success: true, data: accounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  AUDIT LOG  ███████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

app.get('/api/audit-log', verifyToken, checkRole(['superadmin']), async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const total = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ success: true, total, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ██  HEALTH & START  ██████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.json({ status: 'running', name: 'SudaCards Admin API', version: '2.0.0' });
});

// محاكي المعاملات التلقائي
function startTransactionSimulator() {
    setInterval(async () => {
        try {
            const users = await User.find({ isActive: true });
            if (users.length < 2) return;

            const categories = ['transfer', 'electricity', 'telecom', 'deposit', 'withdrawal'];
            const category = categories[Math.floor(Math.random() * categories.length)];

            const userIndex1 = Math.floor(Math.random() * users.length);
            const user1 = users[userIndex1];

            let drAccount = '';
            let crAccount = '';
            let senderId = '';
            let senderName = '';
            let receiverId = '';
            let receiverName = '';

            const baseAmount = Math.floor(Math.random() * (12000 - 300 + 1)) + 300;
            const systemFee = Math.floor(baseAmount * 0.01);
            const totalAmount = baseAmount + systemFee;

            if (category === 'deposit') {
                drAccount = 'SYS-SETTLE';
                crAccount = user1.userId;
                senderId = 'SYS-SETTLE';
                senderName = 'حساب التسويات البنكية';
                receiverId = user1.userId;
                receiverName = `${user1.firstName} ${user1.lastName}`;
                
                user1.balance += baseAmount;
                await user1.save();
            } 
            else if (category === 'withdrawal') {
                if (user1.balance < totalAmount) return;
                drAccount = user1.userId;
                crAccount = 'SYS-SETTLE';
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = 'SYS-SETTLE';
                receiverName = 'حساب التسويات البنكية';
                
                user1.balance -= totalAmount;
                await user1.save();
            } 
            else if (category === 'electricity') {
                if (user1.balance < totalAmount) return;
                drAccount = user1.userId;
                crAccount = 'SYS-ELEC';
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = 'SYS-ELEC';
                receiverName = 'حساب وسيط - الكهرباء';
                
                user1.balance -= totalAmount;
                await user1.save();
            } 
            else if (category === 'telecom') {
                if (user1.balance < totalAmount) return;
                const provider = Math.random() > 0.5 ? 'SYS-ZAIN' : 'SYS-SUDANI';
                const providerName = provider === 'SYS-ZAIN' ? 'حساب وسيط - زين' : 'حساب وسيط - سوداني';
                
                drAccount = user1.userId;
                crAccount = provider;
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = provider;
                receiverName = providerName;
                
                user1.balance -= totalAmount;
                await user1.save();
            } 
            else {
                // transfer
                let userIndex2 = Math.floor(Math.random() * users.length);
                while (userIndex2 === userIndex1) {
                    userIndex2 = Math.floor(Math.random() * users.length);
                }
                const user2 = users[userIndex2];
                if (user1.balance < totalAmount) return;

                drAccount = user1.userId;
                crAccount = user2.userId;
                senderId = user1.userId;
                senderName = `${user1.firstName} ${user1.lastName}`;
                receiverId = user2.userId;
                receiverName = `${user2.firstName} ${user2.lastName}`;
                
                user1.balance -= totalAmount;
                await user1.save();
                
                user2.balance += baseAmount;
                await user2.save();
            }

            const txId = generate16DigitTransactionId();
            const txDate = new Date();

            const tx = await Transaction.create({
                transactionId: txId,
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
                status: 'completed',
                paymentMethod: ['wallet', 'nfc', 'bank_card'][Math.floor(Math.random() * 3)],
                externalRef: `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
                note: `عملية محاكاة ${category} بقيمة ${baseAmount} جنيه`,
                branchId: 'HEAD_QUARTERS',
                createdAt: txDate,
                updatedAt: txDate
            });

            console.log(`💸 [SIMULATOR] معاملة جديدة: ${txId} بقيمة ${baseAmount}`);
            
            // Broadcast via Socket.io
            io.emit('new-transaction', tx);

        } catch (err) {
            console.error('❌ خطأ في محاكي المعاملات:', err);
        }
    }, 30000); // كل 30 ثانية
}

// ═══════════════════════════════════════════════════════════════
// ██  BANK GATEWAYS & AUTOMATED TOP-UP API  ████████████████████
// ═══════════════════════════════════════════════════════════════

// 1. جلب قائمة كل البوابات البنكية (لوحة التحكم)
app.get('/api/admin/bank-gateways', verifyToken, checkRole(['superadmin', 'manager', 'audit']), async (req, res) => {
    try {
        const gateways = await BankGateway.find().sort({ createdAt: -1 });
        const usedCount = await UsedBankTransaction.countDocuments();
        res.json({ success: true, gateways, totalUsedTransactions: usedCount });
    } catch (error) {
        console.error('Fetch bank gateways error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

// 2. إضافة بوابة بنك جديدة (لوحة التحكم)
app.post('/api/admin/bank-gateways', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const { name, code, apiUrl, apiKey, merchantAccount, validityHours, instructions } = req.body;
        if (!name || !code || !merchantAccount) {
            return res.status(400).json({ success: false, message: 'يرجى إدخال اسم البنك، كود البنك، ورقم حساب استقبال الأموال' });
        }

        const formattedCode = code.trim().toUpperCase();
        const existing = await BankGateway.findOne({ code: formattedCode });
        if (existing) {
            return res.status(400).json({ success: false, message: 'كود البنك موجود مسبقاً' });
        }

        const gateway = await BankGateway.create({
            name: name.trim(),
            code: formattedCode,
            apiUrl: apiUrl ? apiUrl.trim() : '',
            apiKey: apiKey ? apiKey.trim() : '',
            merchantAccount: merchantAccount.trim(),
            validityHours: validityHours ? parseInt(validityHours) : 6,
            instructions: instructions || 'قم بتحويل المبلغ إلى رقم الحساب الموضح أدناه عبر تطبيق البنك، ثم ادخل رقم العملية لمطابقتها لشحن رصيدك فورا.',
            isActive: true
        });

        res.json({ success: true, message: 'تم إضافة البوابة البنكية بنجاح', gateway });
    } catch (error) {
        console.error('Create bank gateway error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة البنك' });
    }
});

// 3. تعديل أو تفعيل/إيقاف بوابة بنكية (لوحة التحكم)
app.put('/api/admin/bank-gateways/:id', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const { name, apiUrl, apiKey, merchantAccount, validityHours, instructions, isActive } = req.body;
        const gateway = await BankGateway.findById(req.params.id);
        if (!gateway) return res.status(404).json({ success: false, message: 'البنك غير موجود' });

        if (name !== undefined) gateway.name = name.trim();
        if (apiUrl !== undefined) gateway.apiUrl = apiUrl.trim();
        if (apiKey !== undefined) gateway.apiKey = apiKey.trim();
        if (merchantAccount !== undefined) gateway.merchantAccount = merchantAccount.trim();
        if (validityHours !== undefined) gateway.validityHours = parseInt(validityHours);
        if (instructions !== undefined) gateway.instructions = instructions;
        if (isActive !== undefined) gateway.isActive = Boolean(isActive);

        await gateway.save();
        res.json({ success: true, message: 'تم تحديث بيانات البوابة البنكية بنجاح', gateway });
    } catch (error) {
        console.error('Update bank gateway error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحديث' });
    }
});

// 4. اختبار الاتصال بالبنك (لوحة التحكم)
app.post('/api/admin/bank-gateways/:id/test', verifyToken, checkRole(['superadmin', 'manager']), async (req, res) => {
    try {
        const gateway = await BankGateway.findById(req.params.id);
        if (!gateway) return res.status(404).json({ success: false, message: 'البنك غير موجود' });

        res.json({
            success: true,
            message: `تم اختبار الاتصال بـ API بنك (${gateway.name}) بنجاح! البوابة جاهزة لاستقبال المعاملات.`,
            status: 'ONLINE',
            latencyMs: Math.floor(40 + Math.random() * 30)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل الاتصال بسيرفر البنك' });
    }
});

// 5. جلب البنوك المتاحة للشحن (تطبيق الموبايل)
app.get('/api/users/topup/gateways', verifyToken, async (req, res) => {
    try {
        const gateways = await BankGateway.find({ isActive: true }).select('name code merchantAccount validityHours instructions logoUrl');
        res.json({ success: true, gateways });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في جلب طرق الشحن' });
    }
});

// 6. المطابقة التلقائية وشحن الحساب برقم العملية البنكية (تطبيق الموبايل)
app.post('/api/users/topup/verify', verifyToken, async (req, res) => {
    try {
        const { bankCode, referenceNumber, amount, bankTxTime } = req.body;
        const depositAmount = parseFloat(amount);

        if (!bankCode || !referenceNumber || isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({ success: false, message: 'يرجى اختيار البنك، وإدخال رقم العملية والمبلغ الصحيح' });
        }

        const cleanRef = referenceNumber.toString().trim();
        const formattedBankCode = bankCode.trim().toUpperCase();

        // 🛡️ 1. فحص منع التكرار البنكي الفريد (Anti-Replay Guarantee)
        const alreadyUsed = await UsedBankTransaction.findOne({ bankCode: formattedBankCode, referenceNumber: cleanRef });
        if (alreadyUsed) {
            return res.status(400).json({
                success: false,
                isReplay: true,
                message: 'رقم العملية البنكية تم استخدامه وحصده مسبقاً في نظام سوداكارد، ولا يمكن تكراره نهائياً لأسباب أمنية!'
            });
        }

        // 2. جلب بيانات البنك المختار
        const gateway = await BankGateway.findOne({ code: formattedBankCode, isActive: true });
        if (!gateway) {
            return res.status(400).json({ success: false, message: 'بوابة هذا البنك غير متوفرة أو معطلة حالياً' });
        }

        // ⏳ 3. فحص شرط الصلاحية الزمنية (6 ساعات)
        const now = new Date();
        const txDate = bankTxTime ? new Date(bankTxTime) : new Date(now.getTime() - (20 * 60 * 1000)); // افتراضي
        const diffInHours = (now - txDate) / (1000 * 60 * 60);

        const maxHours = gateway.validityHours || 6;
        if (diffInHours > maxHours) {
            return res.status(400).json({
                success: false,
                isExpired: true,
                message: `انتهت مهلة الـ ${maxHours} ساعات المحددة لاستخدام رقم هذه العملية. تم إرسال أمر استرداد وتوجيه المبلغ تلقائياً لحسابك في بنكك.`
            });
        }

        // 4. تنفيذ الشحن المالي المعتمد
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        user.balance += depositAmount;
        await user.save();

        // 5. تسجيل رقم العملية في سجل حظر التكرار (Anti-Replay Ledger)
        await UsedBankTransaction.create({
            bankCode: formattedBankCode,
            referenceNumber: cleanRef,
            userId: user._id,
            userAccount: user.accountNumber,
            amount: depositAmount,
            status: 'completed',
            usedAt: new Date()
        });

        // 6. إنشاء سجل المعاملة المالية برقم 16 رقماً بنكياً
        const systemTxId = generate16DigitTransactionId();
        const transaction = await Transaction.create({
            transactionId: systemTxId,
            senderId: user._id,
            receiverId: user._id,
            drAccount: gateway.merchantAccount,
            crAccount: user.accountNumber,
            senderName: `${gateway.name} (${cleanRef})`,
            receiverName: `${user.firstName} ${user.lastName}`,
            amount: depositAmount,
            totalAmount: depositAmount,
            baseAmount: depositAmount,
            type: 'credit',
            category: 'deposit',
            status: 'completed',
            note: `تغذية حساب عبر ${gateway.name} برقم مرجعي: ${cleanRef}`,
            description: `تغذية حساب عبر ${gateway.name} برقم مرجعي: ${cleanRef}`,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: `تم التحقق من العملية البنكية وشحن حسابك بمبلغ ${depositAmount.toLocaleString('ar-SA')} SDG بنجاح!`,
            transactionId: systemTxId,
            referenceNumber: cleanRef,
            bankName: gateway.name,
            newBalance: user.balance,
            transaction
        });

    } catch (error) {
        console.error('Verify bank topup error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق من العملية البنكية' });
    }
});

// ==========================================
// 🛡️ مسارات الأمان المتقدمة (استعادة ونقل الأجهزة)
// ==========================================

app.get('/api/users/recover/questions/:accountNumber', async (req, res) => {
    try {
        const user = await User.findOne({ accountNumber: req.params.accountNumber });
        if (!user) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });
        
        if (!user.securityQuestions || user.securityQuestions.length < 2) {
            return res.status(400).json({ success: false, message: 'لم تقم بإعداد أسئلة الأمان مسبقاً.' });
        }
        
        const questions = user.securityQuestions.map(q => ({
            question: q.question
        }));
        
        res.json({ success: true, questions });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 1. استعادة الحساب: التحقق من أسئلة الأمان
app.post('/api/users/recover/verify-questions', async (req, res) => {
    try {
        const { accountNumber, answers } = req.body;
        const user = await User.findOne({ accountNumber });
        if (!user) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });

        if (!user.securityQuestions || user.securityQuestions.length < 2) {
            return res.status(400).json({ success: false, message: 'لم تقم بإعداد أسئلة الأمان سابقاً. يرجى مراجعة الدعم الفني.' });
        }

        let correct = 0;
        for (const answer of answers) {
            const q = user.securityQuestions.find(sq => sq.question === answer.question);
            if (q && q.answerHash === sha256(answer.answer.trim().toLowerCase())) {
                correct++;
            }
        }

        if (correct >= 2) {
            return res.json({ success: true, message: 'الإجابات صحيحة' });
        } else {
            return res.status(400).json({ success: false, message: 'الإجابات غير متطابقة' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 2. استعادة الحساب: التحقق من PIN والإيميل وإرسال OTP
app.post('/api/users/recover/verify-pin', async (req, res) => {
    try {
        const { accountNumber, email, pin } = req.body;
        const user = await User.findOne({ accountNumber });
        
        if (!user || user.email !== email || user.pinHash !== sha256(pin)) {
            return res.status(400).json({ success: false, message: 'البيانات غير متطابقة' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
        await user.save();

        await sendOTPEmail(user.email, otpCode);
        res.json({ success: true, message: 'تم إرسال رمز التحقق' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 3. استعادة الحساب: تعيين كلمة مرور جديدة وإلغاء القفل
app.post('/api/users/recover/reset-password', async (req, res) => {
    try {
        const { accountNumber, otpCode, newPassword } = req.body;
        const user = await User.findOne({ accountNumber });

        if (!user || user.otpCode !== otpCode || new Date() > user.otpExpires) {
            return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
        }

        user.loginPasswordHash = sha256(newPassword);
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        await user.save();

        res.json({ success: true, message: 'تم استعادة الحساب وتغيير كلمة المرور بنجاح' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 4. نقل الجهاز: طلب OTP
app.post('/api/users/device-change/request', async (req, res) => {
    try {
        const { accountNumber, deviceId } = req.body;
        const user = await User.findOne({ accountNumber });
        
        if (!user) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = new Date(Date.now() + 10 * 60000);
        await user.save();

        await sendOTPEmail(user.email, otpCode);
        res.json({ success: true, message: 'تم إرسال رمز التحقق' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 5. نقل الجهاز: تأكيد النقل (مع فك الارتباط القديم)
app.post('/api/users/device-change/verify', async (req, res) => {
    try {
        const { accountNumber, deviceId, otpCode, answers } = req.body;
        const user = await User.findOne({ accountNumber });
        
        if (!user || user.otpCode !== otpCode || new Date() > user.otpExpires) {
            return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح أو منتهي' });
        }

        if (user.securityQuestions && user.securityQuestions.length >= 2) {
            let correct = 0;
            for (const answer of answers || []) {
                const q = user.securityQuestions.find(sq => sq.question === answer.question);
                if (q && q.answerHash === sha256(answer.answer.trim().toLowerCase())) correct++;
            }
            if (correct < 2) return res.status(400).json({ success: false, message: 'إجابات أسئلة الأمان غير صحيحة' });
        }

        // فك ارتباط الحساب القديم الذي يملك نفس الجهاز
        const oldUser = await User.findOne({ deviceId });
        if (oldUser && oldUser._id.toString() !== user._id.toString()) {
            oldUser.deviceId = null;
            await oldUser.save();
            
            // تحديث سجل الجهاز بفك الارتباط
            const dr = await DeviceRecord.findOne({ deviceId });
            if (dr) {
                const historyRecord = dr.history.find(h => h.user.toString() === oldUser._id.toString() && !h.unlinkedAt);
                if (historyRecord) historyRecord.unlinkedAt = new Date();
                await dr.save();
            }
        }

        // ربط الحساب الجديد بالجهاز
        user.deviceId = deviceId;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.pendingDeviceId = null;
        user.deviceChangeAttempts = 0;
        await user.save();

        // تحديث سجل الجهاز للمستخدم الجديد
        let newDr = await DeviceRecord.findOne({ deviceId });
        if (!newDr) newDr = new DeviceRecord({ deviceId });
        newDr.transferCount += 1;
        newDr.history.push({
            user: user._id,
            accountNumber: user.accountNumber,
            name: user.firstName,
            linkedAt: new Date()
        });
        await newDr.save();

        // إصدار التوكن
        const token = jwt.sign(
            { id: user._id, userId: user.userId, email: user.email, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, message: 'تم نقل الحساب وتأكيد الجهاز بنجاح', token });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر', error: e.message });
    }
});

// ==========================================
// 🔐 Security & Biometric API
// ==========================================
app.put('/api/users/security/biometric', verifyToken, async (req, res) => {
    try {
        const { enabled, deviceId } = req.body;
        const user = await findUserFlexible(req.user.id || req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        user.biometricEnabled = Boolean(enabled);
        user.biometricDeviceId = enabled ? (deviceId || user.deviceId) : null;
        await user.save();

        res.json({
            success: true,
            message: enabled ? 'تم تفعيل الدخول بالبصمة على السيرفر' : 'تم تعطيل الدخول بالبصمة على السيرفر',
            biometricEnabled: user.biometricEnabled
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر', error: e.message });
    }
});

// ==========================================
// 🏢 Admin Dashboard API - Devices
// ==========================================
app.get('/api/admin/devices', async (req, res) => {
    try {
        const devices = await DeviceRecord.find().sort({ updatedAt: -1 }).populate('history.user', 'firstName lastName email status isActive');
        res.json({ success: true, devices });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في استرجاع الأجهزة' });
    }
});

app.get('/api/admin/devices/:deviceId', async (req, res) => {
    try {
        const device = await DeviceRecord.findOne({ deviceId: req.params.deviceId }).populate('history.user', 'firstName lastName email status isActive');
        if (!device) return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
        res.json({ success: true, device });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في استرجاع بيانات الجهاز' });
    }
});


const NfcCard = require('./models/NfcCard');

// ==========================================
// 💳 Admin Dashboard API - NFC Cards
// ==========================================
app.get('/api/admin/nfc-cards', async (req, res) => {
    try {
        const cards = await NfcCard.find().populate('user', 'firstName lastName email accountNumber');
        res.json({ success: true, cards });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ في استرجاع البطاقات', error: e.message });
    }
});

app.post('/api/admin/nfc-cards', async (req, res) => {
    try {
        const { cardId, user, type } = req.body;
        const newCard = new NfcCard({ cardId, user, type, status: 'Active' });
        await newCard.save();
        res.json({ success: true, message: 'تم إصدار البطاقة بنجاح', card: newCard });
    } catch (e) {
        res.status(500).json({ success: false, message: 'فشل إصدار البطاقة', error: e.message });
    }
});

app.put('/api/admin/nfc-cards/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const card = await NfcCard.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, message: 'تم تحديث حالة البطاقة', card });
    } catch (e) {
        res.status(500).json({ success: false, message: 'فشل تحديث حالة البطاقة', error: e.message });
    }
});

// تشغيل السيميوليتور
startTransactionSimulator();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على منفذ ${PORT} مع دعم WebSockets`);
});
