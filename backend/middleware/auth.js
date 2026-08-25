const jwt = require('jsonwebtoken');

// التحقق من صلاحية الـ JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role, branchId }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'الرمز منتهي أو غير صالح' });
    }
};

// التحقق من الدور (RBAC)
// يقبل مصفوفة من الأدوار المسموح لها بالوصول
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'ليس لديك صلاحية للوصول إلى هذا المورد' 
            });
        }
        next();
    };
};

// فلترة بيانات الفرع - يضمن أن المدير يرى بيانات فرعه فقط
// superadmin يرى كل شيء
const branchFilter = (req, res, next) => {
    if (req.user.role === 'superadmin') {
        req.branchFilter = {}; // لا فلترة
    } else {
        req.branchFilter = { branchId: req.user.branchId };
    }
    next();
};

module.exports = { verifyToken, checkRole, branchFilter };
