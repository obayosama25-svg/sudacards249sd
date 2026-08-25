import React, { useEffect, useState, useRef } from 'react';
import { Users, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Zap, DollarSign, Loader2, X, CheckCircle, XCircle, Clock, Check, UserPlus, RefreshCw, Share2, Printer, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getTransactions } from '../api';
import { io } from 'socket.io-client';

const StatCard = ({ title, value, icon, trend, trendValue, isPositive, loading }) => (
  <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{loading ? <Loader2 className="animate-spin" size={24}/> : value}</h3>
      </div>
      <div className="p-3 bg-surface rounded-xl text-primary border border-white/5">{icon}</div>
    </div>
    {trend && (
      <div className={`flex items-center text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? <ArrowUpRight size={14} className="ml-1" /> : <ArrowDownRight size={14} className="ml-1" />}
        <span>{trendValue} {trend}</span>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [range, setRange] = useState('week');

  // Ref to hold range value for WebSockets callbacks to prevent stale state closure
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  // 1. تحميل الإحصائيات عند تغيير النطاق الزمني
  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const statsRes = await getDashboardStats({ range });
        setStats(statsRes.data);
      } catch(e) {
        console.error(e);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [range]);

  // 2. تحميل أحدث العمليات والربط بالسوكت عند البداية فقط
  useEffect(() => {
    async function loadRecent() {
      try {
        const txRes = await getTransactions({ limit: 5 });
        setRecentTx(txRes.data || []);
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRecent();

    const socket = io('http://2.24.108.101:5000');

    socket.on('connect', () => {
      console.log('📡 متصل بخادم السوكت للوقت الحقيقي');
    });

    socket.on('new-transaction', (newTx) => {
      console.log('💸 معاملة جديدة لحظية:', newTx);

      // تحديث أحدث العمليات
      setRecentTx(prev => {
        const updated = [newTx, ...prev];
        return updated.slice(0, 5);
      });

      // تحديث بطاقات الإحصائيات والرسوم البيانية لحظياً
      setStats(prev => {
        if (!prev) return prev;

        const updatedVolume = prev.totalVolume + newTx.totalAmount;
        const updatedRevenue = prev.totalRevenue + newTx.systemFee;
        const updatedTodayCount = prev.todayTxCount + 1;
        const updatedTxCount = prev.txCount + 1;

        // صياغة التاريخ بناءً على النطاق الزمني الحالي وتوقيت السودان (+02:00)
        const currentRange = rangeRef.current;
        const date = new Date(newTx.createdAt);
        const shiftedDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // إزاحة منطقتنا الزمنية
        
        let dateStr = '';
        if (currentRange === 'today') {
          dateStr = shiftedDate.getUTCHours().toString().padStart(2, '0') + ':00';
        } else if (currentRange === 'month') {
          dateStr = (shiftedDate.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + shiftedDate.getUTCDate().toString().padStart(2, '0');
        } else if (currentRange === 'year') {
          dateStr = shiftedDate.getUTCFullYear() + '-' + (shiftedDate.getUTCMonth() + 1).toString().padStart(2, '0');
        } else { // week
          dateStr = shiftedDate.getUTCFullYear() + '-' + (shiftedDate.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + shiftedDate.getUTCDate().toString().padStart(2, '0');
        }

        let trendUpdated = [...(prev.trendData || [])];
        const index = trendUpdated.findIndex(d => d._id === dateStr);
        if (index > -1) {
          trendUpdated[index].volume += newTx.totalAmount;
          trendUpdated[index].count += 1;
        } else {
          trendUpdated.push({ _id: dateStr, volume: newTx.totalAmount, count: 1 });
          trendUpdated.sort((a, b) => a._id.localeCompare(b._id));
          const maxElements = currentRange === 'today' ? 24 : currentRange === 'month' ? 30 : currentRange === 'year' ? 12 : 7;
          if (trendUpdated.length > maxElements) {
            trendUpdated.shift();
          }
        }

        return {
          ...prev,
          totalVolume: updatedVolume,
          totalRevenue: updatedRevenue,
          todayTxCount: updatedTodayCount,
          txCount: updatedTxCount,
          trendData: trendUpdated
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fmt = (n) => n != null ? Number(n).toLocaleString('ar-SA') : '—';

  const chartData = stats?.trendData?.map(d => ({ name: d._id, volume: d.volume, count: d.count })) || [];

  const categoryLabels = {
    transfer: 'تحويل مالي', electricity: 'كهرباء', telecom: 'اتصالات',
    education: 'تعليم', airlines: 'طيران', nfc_payment: 'NFC', refund: 'استرداد',
    deposit: 'إيداع', withdrawal: 'سحب',
  };
  
  const statusLabels = { completed: 'مكتمل', pending: 'قيد التنفيذ', failed: 'فشل', reversed: 'معكوس', refunded: 'مسترد' };
  const methodLabels = { wallet: 'المحفظة الرقمية', nfc: 'بطاقة NFC اللاتلامسية', bank_card: 'البطاقة البنكية' };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">نظرة عامة</h1>
        <p className="text-sm text-gray-400">إحصائيات وأداء تطبيق SudaCards المحدثة لحظياً ⚡</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="إجمالي المستخدمين" value={fmt(stats?.usersCount)} icon={<Users size={22} />} loading={statsLoading} trend="مستخدم نشط" trendValue={fmt(stats?.activeUsersCount)} isPositive={true} />
        <StatCard title="حجم التداولات" value={`${fmt(stats?.totalVolume)} SDG`} icon={<Wallet size={22} />} loading={statsLoading} />
        <StatCard title="المعاملات اليوم" value={fmt(stats?.todayTxCount)} icon={<CreditCard size={22} />} loading={statsLoading} />
        <StatCard title="إيرادات النظام" value={`${fmt(stats?.totalRevenue)} SDG`} icon={<DollarSign size={22} />} loading={statsLoading} trend="عمولات" isPositive={true} />
      </div>

      {/* الرسم البياني وقائمة أحدث العمليات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5">
          {/* رأس قسم الرسم البياني مع أزرار الفلترة */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-white">مؤشر حركة الحجم المالي 📈</h2>
            
            {/* أزرار الفلترة الزمنية */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1 w-max">
              {[
                { id: 'today', label: 'اليوم (خلال ساعة)' },
                { id: 'week', label: 'الأسبوع' },
                { id: 'month', label: 'الشهر' },
                { id: 'year', label: 'العام' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setRange(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    range === btn.id
                      ? 'bg-primary text-white shadow-[0_0_8px_rgba(45,70,255,0.3)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d46ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2d46ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#8f8fa3" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8f8fa3" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="volume" stroke="#2d46ff" strokeWidth={2} fillOpacity={1} fill="url(#colorV)" name="حجم التداول" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {statsLoading ? <Loader2 className="animate-spin" size={32}/> : 'لا توجد بيانات لهذا النطاق حالياً'}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">أحدث العمليات اللحظية ⚡</h2>
          <div className="space-y-3">
            {recentTx.length > 0 ? recentTx.map((tx) => (
              <div 
                key={tx.transactionId} 
                onClick={() => setSelectedTx(tx)}
                className="flex justify-between items-center p-2.5 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                    <Zap size={16}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-[120px]">{tx.senderName || tx.senderId}</p>
                    <p className="text-[11px] text-gray-400">{categoryLabels[tx.category] || tx.category}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{fmt(tx.totalAmount)} SDG</p>
                  <p className={`text-[11px] ${tx.status === 'completed' ? 'text-emerald-400' : tx.status === 'failed' ? 'text-rose-400' : 'text-yellow-400'}`}>
                    {statusLabels[tx.status] || tx.status}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">{loading ? '...' : 'لا توجد عمليات بعد'}</p>
            )}
          </div>
        </div>
      </div>

      {/* إيصال المعاملة المالية المتوهج (المطابق للتطبيق البنكي) */}
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
