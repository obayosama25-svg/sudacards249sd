import React, { useEffect, useState } from 'react';
import { 
  Search, Download, Loader2, ChevronLeft, ChevronRight, RotateCcw, 
  CheckCheck, Activity, DollarSign, Wallet, CreditCard, Clock, Check, 
  X, RefreshCw, Zap, Phone, ArrowDownRight, ArrowUpRight, GraduationCap, Plane, UserCheck, Printer, UserPlus, Share2
} from 'lucide-react';
import { BarChart, Bar, Cell, PieChart, Pie, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { getTransactions, reverseTransaction, reconcileTransaction, getDashboardStats } from '../api';

const categoryLabels = {
  transfer: 'تحويل مالي', electricity: 'كهرباء', telecom: 'اتصالات',
  education: 'تعليم', airlines: 'طيران', nfc_payment: 'NFC', refund: 'استرداد',
  deposit: 'إيداع', withdrawal: 'سحب',
};

const statusLabels = { completed: 'مكتمل', pending: 'قيد التنفيذ', failed: 'فشل', cancelled: 'ملغى', reversed: 'معكوس', refunded: 'مسترد' };

const TransactionStatCard = ({ title, value, subtext, icon, glowColor, loading }) => (
  <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
    <div className={`absolute -right-10 -top-10 w-28 h-28 ${glowColor} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div className="space-y-2">
        <p className="text-gray-400 text-xs font-bold tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-white tracking-tight">
          {loading ? <Loader2 className="animate-spin text-primary" size={24}/> : value}
        </h3>
        {subtext && <p className="text-[10px] text-gray-500 font-bold">{subtext}</p>}
      </div>
      <div className="p-3 bg-white/5 rounded-2xl text-white border border-white/5 shadow-inner">
        {icon}
      </div>
    </div>
  </div>
);

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [reverseModal, setReverseModal] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch(e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await getTransactions(params);
      setTxs(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch(e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadStats();
    load();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const handleReconcile = async (id) => {
    if (!window.confirm('تأكيد مطابقة هذه المعاملة يدوياً؟')) return;
    try {
      await reconcileTransaction(id);
      alert('✅ تمت مطابقة المعاملة وتسويتها بنجاح.');
      load();
      loadStats();
    } catch(e) { 
      alert(e.message); 
    }
  };

  const handleReverse = async (e) => {
    e.preventDefault();
    if (!reverseReason) return alert('الرجاء كتابة سبب عكس القيد المالي');
    try {
      await reverseTransaction(reverseModal, reverseReason);
      alert('✅ تم عكس القيد المالي بنجاح وإرجاع الأرصدة.');
      setReverseModal(null);
      setReverseReason('');
      load();
      loadStats();
    } catch(e) { 
      alert(e.message); 
    }
  };

  const fmt = (n) => n != null ? Number(n).toLocaleString('ar-SA') : '0';

  // معايير الفئات والترجمات والألوان للعمليات
  const serviceColors = {
    transfer: '#3b82f6', electricity: '#f59e0b', telecom: '#10b981',
    deposit: '#14b8a6', withdrawal: '#f97316', education: '#a855f7',
    airlines: '#6366f1', refund: '#ec4899', nfc_payment: '#f43f5e'
  };

  // جلب الأيقونة المخصصة للخدمة
  const getServiceConfig = (cat) => {
    const mapping = {
      transfer: { icon: <RefreshCw size={12}/>, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      electricity: { icon: <Zap size={12}/>, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      telecom: { icon: <Phone size={12}/>, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      deposit: { icon: <ArrowDownRight size={12}/>, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
      withdrawal: { icon: <ArrowUpRight size={12}/>, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
      education: { icon: <GraduationCap size={12}/>, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      airlines: { icon: <Plane size={12}/>, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      nfc_payment: { icon: <CreditCard size={12}/>, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    };
    return mapping[cat] || { icon: <Activity size={12}/>, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  };

  // تجهيز بيانات شارت حجم التداول حسب نوع الخدمة
  const serviceDistributionData = stats?.serviceDistribution?.map(item => ({
    name: categoryLabels[item._id] || item._id,
    count: item.count,
    volume: item.volume,
    color: serviceColors[item._id] || '#cbd5e1'
  })) || [];

  return (
    <div className="space-y-8 relative min-h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">المعاملات المالية (دفتر الأستاذ)</h1>
        <p className="text-xs text-gray-400 font-bold">تسجيل ومراجعة كافة القيود المزدوجة والتسويات والعمولات لحظياً</p>
      </div>

      {/* كروت الإحصائيات الفخمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TransactionStatCard 
          title="إجمالي القيود المالية" 
          value={`${fmt(stats?.txCount)} قيد`} 
          subtext="المسجلة في النظام ككل"
          icon={<Activity size={22} className="text-blue-400" />} 
          glowColor="bg-blue-500"
          loading={statsLoading} 
        />
        <TransactionStatCard 
          title="حجم التداول الكلي" 
          value={`${fmt(stats?.totalVolume)} SDG`} 
          subtext="حجم الحركة المالية بالنظام"
          icon={<Wallet size={22} className="text-indigo-400" />} 
          glowColor="bg-indigo-500"
          loading={statsLoading} 
        />
        <TransactionStatCard 
          title="إجمالي العمولات والربح" 
          value={`${fmt(stats?.totalRevenue)} SDG`} 
          subtext="صافي أرباح النظام من العمولات"
          icon={<DollarSign size={22} className="text-emerald-400" />} 
          glowColor="bg-emerald-500"
          loading={statsLoading} 
        />
        <TransactionStatCard 
          title="العمليات المنفذة اليوم" 
          value={`${fmt(stats?.todayTxCount)} معاملة`} 
          subtext="حركات الـ 24 ساعة الماضية"
          icon={<Clock size={22} className="text-rose-400" />} 
          glowColor="bg-rose-500"
          loading={statsLoading} 
        />
      </div>

      {/* شارتات وتحليلات الخدمات وحجم التداول */}
      {!statsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* شارت تكرار وعدد المعاملات حسب الخدمة */}
          <div className="glass p-6 rounded-[30px] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">نسبة أعداد المعاملات حسب نوع الخدمة 📊</h3>
              <p className="text-[10px] text-gray-400">تكرار الاستخدام وحجم طلبات العملاء لكل فئة</p>
            </div>
            <div className="h-48 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {serviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: 'Cairo' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3 text-[10px] font-bold text-gray-400">
              {serviceDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}: {((item.count / (stats?.txCount || 1)) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* شارت حجم الحركة المالي لكل خدمة */}
          <div className="glass p-6 rounded-[30px] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">حجم التداول المالي الإجمالي لكل خدمة (SDG) 💰</h3>
              <p className="text-[10px] text-gray-400">حجم التدفقات النقدية المحصلة بكل فئة</p>
            </div>
            <div className="h-60 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDistributionData}>
                  <XAxis dataKey="name" stroke="#8f8fa3" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8f8fa3" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString('ar-SA')} SDG`}
                    contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: 'Cairo' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]} name="حجم الحركة">
                    {serviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* شريط البحث المطور والفلترة */}
      <div className="glass p-6 rounded-[30px] border border-white/5 space-y-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-white/10 text-white rounded-2xl py-3 pr-11 pl-4 focus:ring-1 focus:ring-primary focus:border-transparent transition-all outline-none text-xs font-bold"
              placeholder="ابحث برقم المعاملة، الاسم، الملاحظات..." 
            />
          </div>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface border border-white/10 text-white rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-primary"
          >
            <option value="">كل الحالات</option>
            {Object.entries(statusLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-surface border border-white/10 text-white rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-primary"
          >
            <option value="">كل الخدمات</option>
            {Object.entries(categoryLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <button type="submit" className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl text-xs transition-colors shadow-md">بحث</button>
        </form>

        {/* فلاتر تاريخية فرعية */}
        <div className="flex flex-wrap gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>من تاريخ:</span>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)}
              className="bg-surface border border-white/10 text-white rounded-xl px-3 py-2 outline-none focus:border-primary" 
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>إلى تاريخ:</span>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)}
              className="bg-surface border border-white/10 text-white rounded-xl px-3 py-2 outline-none focus:border-primary" 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={36}/></div>
        ) : txs.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-bold">لا توجد معاملات مسجلة تطابق هذه الشروط</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-black tracking-wider">
                  <th className="pb-4 pr-4">رمز المعاملة</th>
                  <th className="pb-4">الخدمة</th>
                  <th className="pb-4">الحساب المدين (Dr / مصدر)</th>
                  <th className="pb-4">الحساب الدائن (Cr / مستلم)</th>
                  <th className="pb-4">المبلغ المالي</th>
                  <th className="pb-4">العمولة</th>
                  <th className="pb-4">الإجمالي الكلي</th>
                  <th className="pb-4">الحالة</th>
                  <th className="pb-4">تسوية يدوية</th>
                  <th className="pb-4 pl-4 text-left">إجراءات عكسية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {txs.map((tx) => {
                  const srvConf = getServiceConfig(tx.category);
                  return (
                    <tr 
                      key={tx.transactionId} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <td className="py-4 pr-4 font-mono text-gray-300 text-xs font-bold group-hover:text-primary transition-colors" dir="ltr">
                        {tx.transactionId}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${srvConf.color}`}>
                          {srvConf.icon}
                          {categoryLabels[tx.category] || tx.category}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-white text-xs">{tx.senderName || 'حساب خارجي'}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5" dir="ltr">{tx.drAccount || tx.senderId}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-white text-xs">{tx.receiverName || 'حساب خارجي'}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5" dir="ltr">{tx.crAccount || tx.receiverId}</p>
                      </td>
                      <td className="py-4 font-bold text-gray-300 font-mono" dir="ltr">{fmt(tx.baseAmount)}</td>
                      <td className="py-4 text-emerald-400 font-bold font-mono" dir="ltr">{fmt(tx.systemFee)}</td>
                      <td className="py-4 text-white font-black font-mono" dir="ltr">{fmt(tx.totalAmount)}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          tx.status === 'failed' || tx.status === 'reversed' || tx.status === 'refunded' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            tx.status === 'completed' ? 'bg-emerald-400 animate-pulse' :
                            tx.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-rose-400'
                          }`}></span>
                          {statusLabels[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="py-4" onClick={e => e.stopPropagation()}>
                        {tx.isReconciled ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1 font-bold"><CheckCheck size={14}/> تمت تسويتها</span>
                        ) : tx.status === 'completed' ? (
                          <button 
                            onClick={() => handleReconcile(tx.transactionId)} 
                            className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 border border-yellow-500/20 px-2 py-1 rounded-lg bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                          >
                            تسوية ومطابقة
                          </button>
                        ) : <span className="text-gray-600 font-bold">—</span>}
                      </td>
                      <td className="py-4 pl-4 text-left" onClick={e => e.stopPropagation()}>
                        {tx.status === 'completed' && !tx.reversalOf ? (
                          <button 
                            onClick={() => setReverseModal(tx.transactionId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                          >
                            <RotateCcw size={11}/> عكس القيد
                          </button>
                        ) : tx.reversalOf ? (
                          <span className="text-[10px] text-gray-500 font-bold">معكوسة لـ {tx.reversalOf}</span>
                        ) : <span className="text-gray-600 font-bold">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-between items-center mt-6 text-xs text-gray-400 font-bold border-t border-white/5 pt-4">
            <p>صفحة {page} من {pages} (إجمالي القيود: {fmt(total)} معاملة)</p>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1} 
                onClick={() => { setPage(p => p-1); load(p-1); }}
                className="px-3 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 flex items-center gap-1 transition-all"
              >
                <ChevronRight size={14}/> السابق
              </button>
              <button 
                disabled={page >= pages} 
                onClick={() => { setPage(p => p+1); load(p+1); }}
                className="px-3 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 flex items-center gap-1 transition-all"
              >
                التالي <ChevronLeft size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال عكس القيد المالي المحسن */}
      {reverseModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setReverseModal(null)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleReverse} className="glass p-6 rounded-3xl border border-white/10 w-full max-w-md space-y-4 animate-scale-up text-right">
              <h3 className="text-lg font-bold text-white">إجراء عكس قيد محاسبي 🔄</h3>
              <p className="text-xs text-gray-400">سيتم تجميد هذا القيد وإرجاع المبلغ الإجمالي بالكامل لحساب المرسل المدين. الرجاء إدخال سبب عكس العملية:</p>
              <textarea 
                required 
                value={reverseReason} 
                onChange={e => setReverseReason(e.target.value)}
                className="w-full bg-surface border border-white/10 text-white rounded-xl p-3 text-xs outline-none focus:border-primary min-h-[100px] font-bold"
                placeholder="أدخل سبب عكس المعاملة للتدقيق والمحاسبة..." 
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md">عكس العملية الآن</button>
                <button type="button" onClick={() => setReverseModal(null)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs border border-white/10 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* إيصال المعاملة المالية المتوهج المحاكي للتطبيق البنكي */}
      {selectedTx && (() => {
        let bgGradient = 'from-[#072417] via-[#0F3D2A] to-[#051C12]';
        let borderColor = 'border-[#00FF87]/60';
        let glowShadow = 'shadow-[0_0_50px_rgba(0,255,135,0.3)]';
        let btnColor = 'bg-[#00FF87] hover:bg-[#00FF87]/90 text-black';
        let statusText = 'تمت بنجاح';
        let StatusIcon = () => (
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
            <Check size={40} className="text-[#0F5132]" />
          </div>
        );

        if (selectedTx.status === 'pending') {
          bgGradient = 'from-[#2C2209] via-[#4C3E14] to-[#1E1605]';
          borderColor = 'border-[#FFD700]/60';
          glowShadow = 'shadow-[0_0_50px_rgba(255,215,0,0.3)]';
          btnColor = 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black';
          statusText = 'قيد الإجراء';
          StatusIcon = () => (
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md animate-pulse">
              <Clock size={40} className="text-[#4C3E14]" />
            </div>
          );
        } else if (selectedTx.status === 'failed' || selectedTx.status === 'reversed' || selectedTx.status === 'refunded') {
          bgGradient = 'from-[#2B0A0D] via-[#4C151A] to-[#1E0406]';
          borderColor = 'border-[#FF453A]/60';
          glowShadow = 'shadow-[0_0_50px_rgba(255,69,58,0.3)]';
          btnColor = 'bg-[#FF453A] hover:bg-[#FF453A]/90 text-white';
          statusText = selectedTx.status === 'reversed' ? 'معكوسة' : selectedTx.status === 'refunded' ? 'مستردة' : 'فشلت العملية';
          StatusIcon = () => (
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
              <X size={40} className="text-[#842029]" />
            </div>
          );
        }

        const txTime = new Date(selectedTx.createdAt).toLocaleString('ar-SA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const renderRow = (label, value, isDarkRow, isAmount = false) => (
          <div className={`flex justify-between items-center px-4 py-3 text-xs ${
            isDarkRow ? 'bg-white/[0.04]' : 'bg-transparent'
          }`}>
            <span className="text-gray-400 font-medium">{label}</span>
            <span className={`text-white text-right truncate max-w-[200px] ${
              isAmount ? 'font-black text-sm text-[#00FF87]' : 'font-bold'
            }`} dir={label.includes('حساب') || label.includes('العملية') ? 'ltr' : 'rtl'}>
              {value}
            </span>
          </div>
        );

        return (
          <>
            <div 
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 transition-opacity duration-300"
              onClick={() => setSelectedTx(null)}
            ></div>
            
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className={`w-full max-w-md bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-[30px] p-6 ${glowShadow} flex flex-col items-center animate-scale-up text-right`}>
                
                <div className="mb-4">
                  <StatusIcon />
                </div>

                <h3 className="text-base font-black text-white mb-6 tracking-wide font-mono">
                  إيصال تحويل مالي
                </h3>

                <div className="w-full bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden mb-6 divide-y divide-white/5">
                  {renderRow('رقم العملية', selectedTx.transactionId, false)}
                  {renderRow('حالة العملية', statusText, true)}
                  {renderRow('التاريخ و الزمن', txTime, false)}
                  {renderRow('من حساب', selectedTx.drAccount || selectedTx.senderId || 'حساب خارجي', true)}
                  {renderRow('الى حساب', selectedTx.crAccount || selectedTx.receiverId || 'N/A', false)}
                  {renderRow('إسم المرسل اليه', selectedTx.receiverName || 'N/A', true)}
                  {renderRow('رقم الموبايل', 'N/A', false)}
                  {renderRow('التعليق', selectedTx.note || 'N/A', true)}
                  {renderRow('المبلغ', `${fmt(selectedTx.totalAmount)} SDG`, false, true)}
                </div>

                <button 
                  onClick={() => setSelectedTx(null)}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all border border-white/20 shadow-lg ${btnColor} mb-6`}
                >
                  موافق
                </button>

                <div className="flex justify-between items-center w-full px-2 text-[10px] text-gray-400 font-medium">
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 border border-white/5 rounded-xl"><UserPlus size={16} /></div>
                    <span>إضافة مستفيد</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 border border-white/5 rounded-xl"><RefreshCw size={16} /></div>
                    <span>تحويل مجددًا</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 border border-white/5 rounded-xl"><Share2 size={16} /></div>
                    <span>مشاركة</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 border border-white/5 rounded-xl"><Printer size={16} /></div>
                    <span>طباعة</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 border border-white/5 rounded-xl"><Download size={16} /></div>
                    <span>تحميل</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
