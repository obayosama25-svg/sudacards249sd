import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, User, DollarSign, Activity, Calendar, ShieldCheck, ShieldAlert,
  ArrowUpRight, ArrowDownLeft, Zap, Phone, GraduationCap, Plane, CreditCard,
  Clock, Lock, CheckCircle2, AlertTriangle, RefreshCw, Trash2, FileText,
  Building2, Store, Utensils, Coffee, HeartPulse, Image as ImageIcon, Maximize2, X, FileCheck,
  PlusCircle, MinusCircle, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { getUserDetails, getUserAnalytics, getUserStatement, toggleUserStatus, deleteUser, adjustUserBalance } from '../api';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#6366F1'];

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://2.24.108.101:5000${cleanPath}`;
};

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [previewImage, setPreviewImage] = useState(null); // نافذة المعاينة المكبرة

  // حالة نافذة تغذية وخصم الرصيد
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState('deposit'); // 'deposit' | 'deduct'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null); // نافذة إشعار النجاح المصممة
  const [selectedTransaction, setSelectedTransaction] = useState(null); // نافذة تفاصيل العملية المالية (الإشعار)

  const loadDataSilent = async () => {
    try {
      const [uRes, aRes, sRes] = await Promise.all([
        getUserDetails(id).catch(() => null),
        getUserAnalytics(id).catch(() => null),
        getUserStatement(id).catch(() => null)
      ]);
      if (uRes?.data) setUser(uRes.data);
      if (aRes?.analytics) setAnalytics(aRes.analytics);
      if (sRes?.transactions) setTransactions(sRes.transactions);
    } catch (e) {
      console.error('Error updating data silently:', e);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!user) return;
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (adjustType === 'deduct' && user.balance < amountNum) {
      alert('رصيد العميل الحالي غير كافٍ لإجراء عملية الخصم');
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await adjustUserBalance(user._id, adjustType, amountNum, adjustReason);
      
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');

      // تحديث الرصيد في الشاشة مباشرة بدون تجميد
      if (res.newBalance !== undefined) {
        setUser(prev => prev ? { ...prev, balance: res.newBalance } : prev);
      }

      // إظهار النافذة الفخمة في المنتصف
      setSuccessModalData({
        title: adjustType === 'deposit' ? 'تمت تغذية الحساب بنجاح! 🎉' : 'تم الخصم من الحساب بنجاح! 💸',
        message: res.message || 'تم تحديث رصيد العميل بنجاح وتسجيل الحركة في السجل المالي.',
        amount: amountNum,
        newBalance: res.newBalance,
        type: adjustType
      });

      // جلب الرسوم وكشف الحساب في الخلفية بصمت
      loadDataSilent();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء تعديل الرصيد');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. جلب الملف الرئيسي للعميل
      try {
        const uRes = await getUserDetails(id);
        setUser(uRes.data);
      } catch (userErr) {
        console.error('Error fetching user profile:', userErr);
      }

      // 2. جلب التحليلات البيانية
      try {
        const aRes = await getUserAnalytics(id);
        setAnalytics(aRes.analytics);
      } catch (analyticsErr) {
        console.error('Error fetching analytics:', analyticsErr);
      }

      // 3. جلب كشف الحساب
      try {
        const sRes = await getUserStatement(id);
        setTransactions(sRes.transactions || []);
      } catch (statementErr) {
        console.error('Error fetching statement:', statementErr);
      }

    } catch (e) {
      console.error('Error loading user details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleToggle = async () => {
    if (!user) return;
    const actionText = user.isActive ? 'تجميد هذا الحساب' : 'تنشيط وتفعيل الحساب';
    if (!window.confirm(`هل أنت تأكد من إرادتك ${actionText}؟`)) return;

    setActionLoading(true);
    try {
      const res = await toggleUserStatus(user._id);
      setUser(res.data);
    } catch (e) {
      alert(e.message || 'حدث خطأ أثناء تعديل حالة الحساب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm(`⚠️ تحذير شديد: هل أنت متاكد تماماً من حذف حساب (${user.firstName} ${user.lastName}) نهائياً من النظام؟ لا يمكن التراجع!`)) return;

    setActionLoading(true);
    try {
      await deleteUser(user._id);
      navigate('/dashboard/users');
    } catch (e) {
      alert(e.message || 'فشل حذف الحساب');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={40} />
        <p className="text-gray-400 font-bold text-sm">جاري تحضير بيانات الحساب والتحليلات المالية...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-white">لم يتم العثور على بيانات هذا العميل</h2>
        <button 
          onClick={() => navigate('/dashboard/users')}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs"
        >
          العودة لقائمة الحسابات
        </button>
      </div>
    );
  }

  // إعداد بيانات الرسم البياني الشهري
  const monthlyDataMap = {};
  if (analytics?.monthlyTrends) {
    const { sent = [], received = [], bills = [] } = analytics.monthlyTrends;
    
    sent.forEach(item => {
      monthlyDataMap[item._id] = { month: item._id, sent: item.amount, received: 0, bills: 0 };
    });

    received.forEach(item => {
      if (!monthlyDataMap[item._id]) {
        monthlyDataMap[item._id] = { month: item._id, sent: 0, received: item.amount, bills: 0 };
      } else {
        monthlyDataMap[item._id].received = item.amount;
      }
    });

    bills.forEach(item => {
      if (!monthlyDataMap[item._id]) {
        monthlyDataMap[item._id] = { month: item._id, sent: 0, received: 0, bills: item.amount };
      } else {
        monthlyDataMap[item._id].bills = item.amount;
      }
    });
  }

  const chartMonthlyData = Object.values(monthlyDataMap).sort((a, b) => a.month.localeCompare(b.month));

  // إعداد بيانات رسم الفواتير السائبة
  const billPieData = (analytics?.billStats || []).map(b => ({
    name: b._id === 'electricity' ? 'كهرباء' :
          b._id === 'telecom' ? 'اتصالات وشحن' :
          b._id === 'education' ? 'رسوم دراسية' :
          b._id === 'airlines' ? 'تذاكر طيران' : b._id,
    value: b.totalAmount,
    count: b.count
  }));

  // فلترة المعاملات في الجدول
  const filteredTransactions = transactions.filter(t => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'transfer') return t.type === 'transfer' || !t.category;
    if (filterCategory === 'bills') return t.type !== 'transfer' && t.category;
    return true;
  });

  const lastActiveFormatted = analytics?.lastActivity 
    ? new Date(analytics.lastActivity).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'غير متوفر';

  return (
    <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
      
      {/* ─── الشريط العلوي ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-[30px] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/users')}
            className="p-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl border border-white/5 transition-all"
            title="الرجوع"
          >
            <ArrowRight size={20} />
          </button>
          
          <div 
            onClick={() => (user.personalPhotoPath || user.logoPhotoPath) && setPreviewImage(getImageUrl(user.personalPhotoPath || user.logoPhotoPath))}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-emerald-500/20 border border-white/10 flex items-center justify-center text-primary shadow-inner overflow-hidden cursor-pointer group/avatar relative"
            title="انقر لتكبير المعاينة"
          >
            {(user.personalPhotoPath || user.logoPhotoPath) ? (
              <img 
                src={getImageUrl(user.personalPhotoPath || user.logoPhotoPath)} 
                alt="Personal Avatar" 
                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <User size={28} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {user.firstName} {user.middleName} {user.lastName}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                user.isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                {user.isActive ? 'نشط ومفعل' : 'موقوف / مجمد'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-emerald-400" />
                الجوال: <strong className="text-emerald-400 font-bold" dir="ltr">{user.phone || 'غير متوفر'}</strong>
              </span>
              <span>•</span>
              <span>رقم الحساب: <strong className="text-white font-bold">{user.accountNumber}</strong></span>
              <span>•</span>
              <span>المعرف: <strong className="text-white font-bold">{user.userId}</strong></span>
              <span>•</span>
              <span>البريد: <strong className="text-gray-300">{user.email}</strong></span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات الإدارية */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => { setAdjustType('deposit'); setShowAdjustModal(true); }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            title="إيداع وتغذية رصيد لهذا العميل"
          >
            <PlusCircle size={16} />
            تغذية الحساب
          </button>

          <button
            onClick={() => { setAdjustType('deduct'); setShowAdjustModal(true); }}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-2xl font-bold text-xs transition-all flex items-center gap-2"
            title="خصم واقتطاع رصيد من هذا العميل"
          >
            <MinusCircle size={16} />
            خصم من الحساب
          </button>
          <button
            onClick={handleToggle}
            disabled={actionLoading}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs border transition-all flex items-center gap-2 shadow-lg ${
              user.isActive 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {user.isActive ? <Lock size={16} /> : <CheckCircle2 size={16} />}
            {user.isActive ? 'تجميد الحساب' : 'تنشيط الحساب'}
          </button>

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl font-bold text-xs transition-all flex items-center gap-2"
            title="حذف الحساب نهائياً"
          >
            <Trash2 size={16} />
            حذف الحساب
          </button>
        </div>
      </div>

      {/* ─── مؤشرات الأداء الحسابية (KPI Cards) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* الرصيد الحي الحقيقي */}
        <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl opacity-40"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-bold">الرصيد المتاح حالياً</p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                {Number(user.balance).toLocaleString('ar-SA')} <span className="text-xs">SDG</span>
              </h3>
              <p className="text-[10px] text-gray-500 font-bold">السيولة الحية في محفظة العميل</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* إجمالي الوارد (محول له) */}
        <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl opacity-40"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-bold">إجمالي الحوالات الواردة</p>
              <h3 className="text-2xl font-black text-blue-400 font-mono">
                {Number(analytics?.received?.totalAmount || 0).toLocaleString('ar-SA')} <span className="text-xs">SDG</span>
              </h3>
              <p className="text-[10px] text-gray-500 font-bold">عدد العمليات: {analytics?.received?.count || 0} عملية</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <ArrowDownLeft size={22} />
            </div>
          </div>
        </div>

        {/* إجمالي الصادر (محول منه) */}
        <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl opacity-40"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-bold">إجمالي الحوالات الصادرة</p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                {Number(analytics?.sent?.totalAmount || 0).toLocaleString('ar-SA')} <span className="text-xs">SDG</span>
              </h3>
              <p className="text-[10px] text-gray-500 font-bold">عدد التحاويل: {analytics?.sent?.count || 0} عملية</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <ArrowUpRight size={22} />
            </div>
          </div>
        </div>

        {/* الفواتير وتاريخ النشاط */}
        <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl opacity-40"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-bold">نشاط الحساب</p>
              <h3 className="text-lg font-black text-amber-400">
                {analytics?.accountAgeDays || 0} يوم <span className="text-xs text-gray-400 font-normal">(عمر الحساب)</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold">آخر حركة: {lastActiveFormatted}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Clock size={22} />
            </div>
          </div>
        </div>

      </div>

      {/* ─── قسم الوثائق والمستندات الثبوتية ─────────────────────────── */}
      <div className="glass p-6 rounded-[30px] border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="text-primary" size={22} />
              الوثائق والمستندات الثبوتية للعميل
            </h3>
            <p className="text-xs text-gray-400 font-bold">معاينة الملفات المرفقة (الصورة الشخصية، إثبات الهوية، التوقيع المعتمد، الشعار)</p>
          </div>
        </div>

        <div className={`grid gap-5 ${
          (user.userType !== 'personal' || user.logoPhotoPath) 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-3'
        }`}>
          
          {/* 1. الصورة الشخصية */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3 group hover:border-white/10 transition-colors">
            <div className="w-full h-44 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
              {user.personalPhotoPath ? (
                <>
                  <img 
                    src={getImageUrl(user.personalPhotoPath)} 
                    alt="الصورة الشخصية" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button 
                    onClick={() => setPreviewImage(getImageUrl(user.personalPhotoPath))}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 text-xs font-bold"
                  >
                    <Maximize2 size={20} /> تكبير المعاينة
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-500 space-y-2">
                  <User size={36} className="mx-auto text-gray-600" />
                  <p className="text-[11px] font-bold">لم تُرفع الصورة الشخصية</p>
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <User size={14} className="text-primary" /> الصورة الشخصية
            </p>
          </div>

          {/* 2. صورة إثبات الهوية */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3 group hover:border-white/10 transition-colors">
            <div className="w-full h-44 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
              {user.idImagePath ? (
                <>
                  <img 
                    src={getImageUrl(user.idImagePath)} 
                    alt="إثبات الهوية" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button 
                    onClick={() => setPreviewImage(getImageUrl(user.idImagePath))}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 text-xs font-bold"
                  >
                    <Maximize2 size={20} /> تكبير المعاينة
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-500 space-y-2">
                  <ImageIcon size={36} className="mx-auto text-gray-600" />
                  <p className="text-[11px] font-bold">لم تُرفع صورة الهوية</p>
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <CreditCard size={14} className="text-blue-400" /> إثبات الهوية الوطنية / الجواز
            </p>
          </div>

          {/* 3. صورة التوقيع المعتمد */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3 group hover:border-white/10 transition-colors">
            <div className="w-full h-44 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
              {user.signaturePhotoPath ? (
                <>
                  <img 
                    src={getImageUrl(user.signaturePhotoPath)} 
                    alt="التوقيع المعتمد" 
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 bg-white/5"
                  />
                  <button 
                    onClick={() => setPreviewImage(getImageUrl(user.signaturePhotoPath))}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 text-xs font-bold"
                  >
                    <Maximize2 size={20} /> تكبير المعاينة
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-500 space-y-2">
                  <FileText size={36} className="mx-auto text-gray-600" />
                  <p className="text-[11px] font-bold">لم يُرفع التوقيع المعتمد</p>
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-400" /> التوقيع المعتمد
            </p>
          </div>

          {/* 4. شعار المنشأة / التجارية (يظهر فقط للحسابات غير الفردية أو التي تملك شعاراً) */}
          {(user.userType !== 'personal' || user.logoPhotoPath) && (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3 group hover:border-white/10 transition-colors">
              <div className="w-full h-44 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                {user.logoPhotoPath ? (
                  <>
                    <img 
                      src={getImageUrl(user.logoPhotoPath)} 
                      alt="شعار المنشأة" 
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={() => setPreviewImage(getImageUrl(user.logoPhotoPath))}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 text-xs font-bold"
                    >
                      <Maximize2 size={20} /> تكبير المعاينة
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 space-y-2">
                    <Building2 size={36} className="mx-auto text-gray-600" />
                    <p className="text-[11px] font-bold">لم يُرفع الشعار التجاري</p>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Building2 size={14} className="text-purple-400" /> شعار المنشأة / الشعار التجاري
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ─── قسم الرسوم البيانية المتطورة ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الرسم البياني لاتجاهات الحركات (وارد vs صادر vs فواتير) */}
        <div className="lg:col-span-2 glass p-6 rounded-[30px] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">حجم الحركات المالية والتحويلات شهرياً</h3>
              <p className="text-xs text-gray-400 font-bold">مقارنة بين التحويلات الصادرة، الواردة، ومدفوعات الفواتير</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> الوارد</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> الصادر</span>
              <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> الفواتير</span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {chartMonthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 font-bold text-xs">
                لا تتوفر حركات مالية كافية لرسم المنحنى البياني
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" stroke="#6B7280" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <YAxis stroke="#6B7280" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff15', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} SDG`]}
                  />
                  <Bar dataKey="received" name="الوارد" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sent" name="الصادر" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bills" name="الفواتير" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* التوزيع النسبي لدفع الفواتير والخدمات */}
        <div className="glass p-6 rounded-[30px] border border-white/5 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">توزيع مدفوعات الخدمات والفواتير</h3>
            <p className="text-xs text-gray-400 font-bold">تصنيف سدادات العميل (كهرباء، اتصالات...)</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {billPieData.length === 0 ? (
              <div className="text-center text-gray-500 font-bold text-xs">
                لم يقم العميل بسداد أي فواتير خدمات حتى الآن
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {billPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff15', borderRadius: '16px', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => `${Number(val).toLocaleString()} SDG`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* مفتاح الألوان الدائري */}
          {billPieData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              {billPieData.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="truncate">{b.name} ({b.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── جدول كشف الحساب والدفعات المفصل ─────────────────────────── */}
      <div className="glass p-6 rounded-[30px] border border-white/5 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">كشف حساب العميل والسجل التكتيكي</h3>
            <p className="text-xs text-gray-400 font-bold">كافة التحويلات والفواتير الصادرة والواردة لهذا الحساب</p>
          </div>

          {/* فلتر تصنيف العمليات */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 text-xs font-bold">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-xl transition-all ${filterCategory === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              الكل ({transactions.length})
            </button>
            <button
              onClick={() => setFilterCategory('transfer')}
              className={`px-4 py-2 rounded-xl transition-all ${filterCategory === 'transfer' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              التحويلات المالية
            </button>
            <button
              onClick={() => setFilterCategory('bills')}
              className={`px-4 py-2 rounded-xl transition-all ${filterCategory === 'bills' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              الفواتير والخدمات
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-bold">
            لا توجد معاملات مسجلة تطابق الفلتر المختار
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-black tracking-wider">
                  <th className="pb-4 pr-4">معرف العملية</th>
                  <th className="pb-4">نوع الحركة</th>
                  <th className="pb-4">الطرف الآخر / البيان</th>
                  <th className="pb-4">المبلغ</th>
                  <th className="pb-4">التاريخ والوقت</th>
                  <th className="pb-4 pl-4 text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx, idx) => {
                  const isSender = tx.senderId === user.userId || tx.senderId === user.accountNumber || tx.senderId === user._id;
                  
                  // تحديد تسمية وشكل نوع الحركة بكل دقة حسب category و note
                  let typeLabel = 'تحويل وارد';
                  let typeStyle = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                  let TypeIcon = ArrowDownLeft;
                  let isNegative = isSender;

                  if (tx.category === 'deposit' || (tx.note && tx.note.includes('تغذية'))) {
                    typeLabel = 'تغذية حساب (إيداع)';
                    typeStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    TypeIcon = PlusCircle;
                    isNegative = false;
                  } else if (tx.category === 'withdrawal' || (tx.note && tx.note.includes('خصم'))) {
                    typeLabel = 'خصم إداري';
                    typeStyle = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                    TypeIcon = MinusCircle;
                    isNegative = true;
                  } else if (tx.category === 'electricity') {
                    typeLabel = 'شحن كهرباء';
                    typeStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    TypeIcon = Zap;
                    isNegative = true;
                  } else if (tx.category === 'telecom') {
                    typeLabel = 'شحن اتصالات';
                    typeStyle = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                    TypeIcon = Phone;
                    isNegative = true;
                  } else if (isSender) {
                    typeLabel = 'تحويل صادر';
                    typeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                    TypeIcon = ArrowUpRight;
                    isNegative = true;
                  }

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedTransaction({ ...tx, typeLabel, typeStyle, isNegative })}
                      className="hover:bg-white/[0.06] cursor-pointer transition-all duration-200 group"
                      title="اضغط لعرض إشعار وتفاصيل المعاملة كاملة"
                    >
                      <td className="py-4 pr-4 text-xs font-mono font-bold text-gray-300 group-hover:text-primary transition-colors flex items-center gap-2" dir="ltr">
                        <FileText size={14} className="text-gray-500 group-hover:text-primary transition-colors" />
                        {tx.transactionId || 'TX-N/A'}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black ${typeStyle}`}>
                          <TypeIcon size={12} />
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-bold text-white">
                        {tx.receiverName || tx.note || 'غير محدد'}
                      </td>
                      <td className={`py-4 text-sm font-black font-mono ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`} dir="ltr">
                        {isNegative ? '-' : '+'} {Number(tx.amount || 0).toLocaleString('ar-SA')} SDG
                      </td>
                      <td className="py-4 text-xs text-gray-400 font-mono" dir="ltr">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString('ar-SA') : 'N/A'}
                      </td>
                      <td className="py-4 pl-4 text-left">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.status === 'completed' ? 'ناجحة' : tx.status || 'مكتملة'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ─── نافذة تكبير وتدقيق الصورة (Modal Lightbox) ─────────────────── */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 shadow-2xl"
            title="إغلاق المعاينة"
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="المعاينة المكبرة" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
          />
        </div>
      )}

      {/* ─── نافذة تغذية وخصم الرصيد (Balance Adjustment Modal) ─────────── */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass p-7 rounded-[32px] border border-white/10 max-w-md w-full space-y-6 relative shadow-2xl">
            
            <button 
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-6 left-6 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-colors"
              title="إلغاء"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${adjustType === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {adjustType === 'deposit' ? <PlusCircle size={24} /> : <MinusCircle size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {adjustType === 'deposit' ? 'تغذية وإيداع في الحساب' : 'خصم واقتطاع من الحساب'}
                </h3>
                <p className="text-xs text-gray-400 font-bold">العميل: {user.firstName} {user.lastName}</p>
              </div>
            </div>

            {/* مفتاح التبديل المباشر بين التغذية والخصم */}
            <div className="grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdjustType('deposit')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${adjustType === 'deposit' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <PlusCircle size={14} /> تغذية (إيداع +)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('deduct')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${adjustType === 'deduct' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <MinusCircle size={14} /> خصم (اقتطاع -)
              </button>
            </div>

            {/* معلومات الرصيد الحالي */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">الرصيد المتاح حالياً:</span>
              <span className="text-emerald-400 font-mono font-black text-sm">{Number(user.balance).toLocaleString('ar-SA')} SDG</span>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">المبلغ المراد {adjustType === 'deposit' ? 'إضافته' : 'خصمه'} (SDG)</label>
                <input 
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="أدخل المبلغ مثل 5000"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl p-3 text-sm font-bold font-mono focus:ring-1 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">السبب / بيان العملية (اختياري)</label>
                <input 
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={adjustType === 'deposit' ? 'تسوية محاسبية، تغذية نقداً...' : 'خصم رسوم، تسوية خطأ...'}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                    adjustType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  }`}
                >
                  {adjustSubmitting ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    adjustType === 'deposit' ? 'تأكيد إيداع المبلغ' : 'تأكيد خصم المبلغ'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── نافذة إشعار النجاح والتأكيد في منتصف الشاشة (Success Modal) ─── */}
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass p-8 rounded-[36px] border border-white/10 max-w-sm w-full text-center space-y-6 relative shadow-2xl animate-scaleUp">
            
            {/* أيقونة النجاح المتحركة والمعززة بالوهج */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${successModalData.type === 'deposit' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-xl ${
                successModalData.type === 'deposit' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/20'
              }`}>
                <CheckCircle2 size={42} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {successModalData.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">
                {successModalData.message}
              </p>
            </div>

            {/* بطاقة تفاصيل المبلغ والرصيد الجديد */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span>قيمة {successModalData.type === 'deposit' ? 'التغذية' : 'الخصم'}:</span>
                <span className={`font-mono font-black text-sm ${successModalData.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {successModalData.type === 'deposit' ? '+' : '-'} {Number(successModalData.amount).toLocaleString('ar-SA')} SDG
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-white/5">
                <span>الرصيد الجديد:</span>
                <span className="text-white font-mono font-black text-sm">
                  {Number(successModalData.newBalance).toLocaleString('ar-SA')} SDG
                </span>
              </div>
            </div>

            {/* زر موافق الفخم لإنهاء العملية */}
            <button
              onClick={() => setSuccessModalData(null)}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                successModalData.type === 'deposit' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              }`}
            >
              موافق / تم
            </button>

          </div>
        </div>
      )}

      {/* ─── نافذة تفاصيل المعاملة وإشعار سوداكارد المالي (Transaction Receipt Modal) ─── */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass p-8 rounded-[36px] border border-white/10 max-w-md w-full space-y-6 relative shadow-2xl animate-scaleUp">
            
            {/* زر إغلاق النافذة */}
            <button 
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-6 left-6 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>

            {/* الهيدر وشعار سوداكارد */}
            <div className="text-center space-y-2 border-b border-white/10 pb-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-black text-primary mb-1 shadow-inner">
                <CreditCard size={14} />
                SudaCards Bank Receipt
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">إشعار عملية مالية</h3>
              <p className="text-xs text-gray-400 font-bold">رقم المرجع: <span className="font-mono text-emerald-400 font-black">{selectedTransaction.transactionId || selectedTransaction.id || 'N/A'}</span></p>
            </div>

            {/* بطاقة المبلغ الرئيسية */}
            <div className="text-center py-5 bg-white/5 rounded-2xl border border-white/5 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-amber-400"></div>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-black ${selectedTransaction.typeStyle}`}>
                {selectedTransaction.typeLabel}
              </span>
              <div className={`text-3xl font-black font-mono tracking-tight ${selectedTransaction.isNegative ? 'text-rose-400' : 'text-emerald-400'}`} dir="ltr">
                {selectedTransaction.isNegative ? '-' : '+'} {Number(selectedTransaction.amount || selectedTransaction.totalAmount || 0).toLocaleString('ar-SA')} SDG
              </div>
              <div className="text-[11px] text-gray-400 font-bold">
                الحالة: <span className="text-emerald-400 font-black">مكتملة وناجحة ✓</span>
              </div>
            </div>

            {/* تفاصيل المعاملة الدقيقة */}
            <div className="space-y-3 text-xs bg-black/40 p-5 rounded-2xl border border-white/5 font-medium">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-gray-400 font-bold">الطرف الأول (الخصم):</span>
                <span className="text-white font-bold">{selectedTransaction.senderName || selectedTransaction.drAccount || 'حساب النظام'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-gray-400 font-bold">الطرف الثاني (الإضافة):</span>
                <span className="text-white font-bold">{selectedTransaction.receiverName || selectedTransaction.crAccount || `${user.firstName} ${user.lastName}`}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-gray-400 font-bold">التاريخ والوقت:</span>
                <span className="text-gray-200 font-mono" dir="ltr">
                  {selectedTransaction.timestamp ? new Date(selectedTransaction.timestamp).toLocaleString('ar-SA') : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-gray-400 font-bold">تصنيف الحركة:</span>
                <span className="text-gray-200 font-bold">{selectedTransaction.category || 'مالية'}</span>
              </div>

              <div className="flex justify-between items-start py-1.5">
                <span className="text-gray-400 font-bold shrink-0">البيان / السبب:</span>
                <span className="text-amber-400 font-bold text-left">{selectedTransaction.note || selectedTransaction.comment || 'تأكيد اعتماد من الخادم البنكي'}</span>
              </div>
            </div>

            {/* أزرار الإجراءات (طباعة / إغلاق) */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <FileText size={16} /> طباعة الإشعار
              </button>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
