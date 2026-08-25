import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, RefreshCw, AlertCircle, Calendar, ArrowUpRight, Loader2, Search, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getRevenue, getTransactions, reconcileTransaction, reverseTransaction } from '../api';

export default function Revenue() {
  const [revenueData, setRevenueData] = useState(null);
  const [unreconciledTxs, setUnreconciledTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reversal state
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTxId, setReversalTxId] = useState('');
  const [reversalReason, setReversalReason] = useState('');

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [revRes, txRes] = await Promise.all([
        getRevenue(fromDate, toDate),
        getTransactions({ reconciled: 'false', limit: 50 })
      ]);
      setRevenueData(revRes.data);
      setUnreconciledTxs(txRes.data || []);
    } catch (e) {
      console.error('Error loading revenue data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  const handleReconcile = async (txId) => {
    if (!window.confirm('هل أنت متأكد من مطابقة هذه العملية المحاسبية؟')) return;
    setSubmitting(true);
    try {
      await reconcileTransaction(txId);
      alert('تمت مطابقة القيد المالي بنجاح ✅');
      loadData();
    } catch (e) {
      alert(e.message || 'فشلت عملية المطابقة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverseSubmit = async (e) => {
    e.preventDefault();
    if (!reversalTxId || !reversalReason) return;
    setSubmitting(true);
    try {
      await reverseTransaction(reversalTxId, reversalReason);
      alert('تم إجراء القيد العكسي بنجاح 🔄');
      setShowReversalModal(false);
      setReversalTxId('');
      setReversalReason('');
      loadData();
    } catch (e) {
      alert(e.message || 'فشل إجراء القيد العكسي');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => n != null ? Number(n).toLocaleString('ar-SA') : '0';

  const categoryLabels = {
    transfer: 'تحويل مالي', electricity: 'كهرباء', telecom: 'اتصالات',
    education: 'تعليم', airlines: 'طيران', nfc_payment: 'NFC', refund: 'استرداد',
    deposit: 'إيداع', withdrawal: 'سحب',
  };

  const chartData = revenueData?.daily?.map(d => ({ name: d._id, fees: d.fees, count: d.count })).reverse() || [];

  const filteredUnreconciled = unreconciledTxs.filter(tx => 
    tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.receiverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">الإيرادات والمطابقة</h1>
          <p className="text-sm text-gray-400">إدارة عمولات النظام، التسويات المالية، والقيود العكسية</p>
        </div>
        
        {/* فلاتر التاريخ */}
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
          <Calendar size={18} className="text-gray-400 mr-2" />
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent text-xs text-white border-none outline-none focus:ring-0"
          />
          <span className="text-gray-500 text-xs">إلى</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent text-xs text-white border-none outline-none focus:ring-0"
          />
          <button 
            onClick={loadData}
            className="p-2 bg-primary/20 hover:bg-primary/30 rounded-xl transition-all text-primary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <>
          {/* كروت الإحصائيات المالية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">صافي أرباح العمولات</p>
                  <h3 className="text-3xl font-black text-emerald-400">{fmt(revenueData?.grandTotal)} SDG</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-white/5">
                  <DollarSign size={22} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">من عمولات عمليات السحب والتحويل ودفع الفواتير</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">المعاملات المعلقة للمطابقة</p>
                  <h3 className="text-3xl font-black text-primary">{fmt(unreconciledTxs.length)} قيد محاسبي</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary border border-white/5">
                  <AlertCircle size={22} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">تتطلب مطابقة يدوية مع كشوفات حساب البنك المركزي</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">التحكم بالقيود العكسية</p>
                  <h3 className="text-lg font-bold text-white mt-1">تراجع / عكس معاملة</h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-white/5">
                  <ArrowRightLeft size={22} />
                </div>
              </div>
              <button 
                onClick={() => setShowReversalModal(true)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all mt-3"
              >
                إجراء قيد عكسي 🔄
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* منحنى العمولات اليومي */}
            <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">منحنى العمولات اليومي (آخر 30 يوم)</h2>
              {chartData.length > 0 ? (
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#8f8fa3" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8f8fa3" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFees)" name="قيمة العمولات" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  لا توجد بيانات عمولات للتاريخ المحدد
                </div>
              )}
            </div>

            {/* توزيع العمولات حسب الفئة */}
            <div className="glass p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">العمولات حسب نوع الخدمة</h2>
              <div className="space-y-4">
                {revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                  revenueData.byCategory.map((cat) => {
                    const percentage = Math.min(100, Math.round((cat.totalFees / (revenueData.grandTotal || 1)) * 100));
                    return (
                      <div key={cat._id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">{categoryLabels[cat._id] || cat._id}</span>
                          <span className="text-emerald-400 font-bold">{fmt(cat.totalFees)} SDG ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>العدد: {fmt(cat.txCount)} معاملة</span>
                          <span>حجم التداول: {fmt(cat.totalVolume)} SDG</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-10">لا توجد تفاصيل فئات بعد</p>
                )}
              </div>
            </div>
          </div>

          {/* جدول المعاملات غير المطابقة */}
          <div className="glass p-6 rounded-2xl border border-white/5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">مطابقة العمليات المعلقة</h2>
                <p className="text-xs text-gray-400">يرجى مطابقتها يدوياً مع كشف البنك بمجرد التأكد من التحويل الفعلي</p>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-white rounded-full py-2 pr-10 pl-4 focus:ring-1 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                  placeholder="ابحث برمز المعاملة، المرسل، المستفيد..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400">
                    <th className="pb-3 font-semibold">رمز العملية</th>
                    <th className="pb-3 font-semibold">المرسل</th>
                    <th className="pb-3 font-semibold">المستقبل</th>
                    <th className="pb-3 font-semibold">المبلغ الأساسي</th>
                    <th className="pb-3 font-semibold">عمولة النظام</th>
                    <th className="pb-3 font-semibold">الإجمالي</th>
                    <th className="pb-3 font-semibold">التاريخ</th>
                    <th className="pb-3 font-semibold">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnreconciled.length > 0 ? (
                    filteredUnreconciled.map((tx) => (
                      <tr key={tx.transactionId} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-3.5 font-bold text-white">{tx.transactionId}</td>
                        <td className="py-3.5">
                          <p className="font-semibold text-white">{tx.senderName || tx.senderId}</p>
                          <p className="text-[10px] text-gray-500">{tx.drAccount}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-white">{tx.receiverName}</p>
                          <p className="text-[10px] text-gray-500">{tx.crAccount}</p>
                        </td>
                        <td className="py-3.5 font-bold text-white">{fmt(tx.baseAmount)} SDG</td>
                        <td className="py-3.5 text-emerald-400 font-bold">{fmt(tx.systemFee)} SDG</td>
                        <td className="py-3.5 font-bold text-white">{fmt(tx.totalAmount)} SDG</td>
                        <td className="py-3.5 text-gray-400">{new Date(tx.createdAt).toLocaleString('ar-SA')}</td>
                        <td className="py-3.5">
                          <button
                            onClick={() => handleReconcile(tx.transactionId)}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-bold transition-all flex items-center gap-1.5 hover:scale-[1.03] disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            طابق الآن
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-10">
                        لا توجد معاملات مالية غير مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* مودال إجراء قيد عكسي */}
      {showReversalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">إجراء قيد مالي عكسي (تسوية/إرجاع)</h3>
              <button 
                onClick={() => setShowReversalModal(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleReverseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">رمز العملية الأصلية (Transaction ID):</label>
                <input 
                  type="text" 
                  value={reversalTxId}
                  onChange={(e) => setReversalTxId(e.target.value)}
                  placeholder="مثال: TX-100021"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">سبب الإرجاع / العكس:</label>
                <textarea 
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="اكتب سبب عكس القيد بالتفصيل لأغراض الرقابة..."
                  required
                  rows="4"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري العكس...' : 'تأكيد العكس المالي 🔄'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReversalModal(false)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
