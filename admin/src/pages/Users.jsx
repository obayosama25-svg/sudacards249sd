import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, 
  Users as UsersIcon, DollarSign, Activity, GraduationCap, Building2, 
  Store, Utensils, Coffee, HeartPulse, User, ShieldAlert, Trash2, Eye
} from 'lucide-react';
import { BarChart, Bar, Cell, PieChart, Pie, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { getUsers, toggleUserStatus, getUsersStats, deleteUser } from '../api';

const UserStatCard = ({ title, value, subtext, icon, glowColor, loading }) => (
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

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'الكل', userType: '' },
    { id: 'personal', label: 'أفراد', userType: 'personal' },
    { id: 'merchant', label: 'تجار', userType: 'merchant' },
    { id: 'company', label: 'شركات', userType: 'company' },
    { id: 'restaurant-cafe', label: 'مطاعم وكافيهات', userType: 'restaurant,cafe' },
    { id: 'health', label: 'القطاع الصحي', userType: 'hospital,health_center,pharmacy' },
    { id: 'university', label: 'جامعات', userType: 'university' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getUsersStats();
      setStats(res.data);
    } catch(e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const load = async (p = page, s = search, type = currentTab?.userType) => {
    setLoading(true);
    try {
      const res = await getUsers({ 
        page: p, 
        limit: 15, 
        search: s || undefined,
        userType: type || undefined 
      });
      setUsers(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch(e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    loadStats();
    load(); 
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const handleTabChange = (tabId, userType) => {
    setActiveTab(tabId);
    setPage(1);
    load(1, search, userType);
  };

  const handleToggle = async (id, currentStatus) => {
    const actionText = currentStatus ? 'تعطيل وتجميد حساب' : 'تنشيط وتفعيل حساب';
    if (!window.confirm(`هل أنت متأكد من ${actionText} هذا العميل؟`)) return;
    try {
      await toggleUserStatus(id);
      load();
      loadStats();
    } catch(e) { 
      alert(e.message); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل انت متأكد من هذا القرار؟')) return;
    if (!window.confirm('تأكيد نهائي: هل أنت متأكد تماماً من حذف هذا الحساب وكافة صوره وملفاته بشكل نهائي ولا يمكن التراجع عنه؟')) return;
    
    try {
      await deleteUser(id);
      load();
      loadStats();
    } catch(e) {
      alert(e.message);
    }
  };

  const fmt = (n) => n != null ? Number(n).toLocaleString('ar-SA') : '0';

  const activePercentage = stats 
    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) 
    : '0';

  // معايير الفئات والترجمات والألوان
  const typeLabels = {
    personal: 'أفراد', merchant: 'تجار', company: 'شركات',
    restaurant: 'مطاعم', cafe: 'كافيهات', hospital: 'مستشفيات',
    health_center: 'مراكز صحية', pharmacy: 'صيدليات', university: 'جامعات'
  };

  const typeColors = {
    personal: '#3b82f6', merchant: '#f59e0b', company: '#a855f7',
    restaurant: '#f97316', cafe: '#ec4899', hospital: '#f43f5e',
    health_center: '#14b8a6', pharmacy: '#10b981', university: '#6366f1'
  };

  const getUserTypeConfig = (type) => {
    const mapping = {
      personal: { label: 'مستخدم عادي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <User size={12}/> },
      merchant: { label: 'تاجر', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Store size={12}/> },
      company: { label: 'شركة', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Building2 size={12}/> },
      restaurant: { label: 'مطعم', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <Utensils size={12}/> },
      cafe: { label: 'كافيه', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: <Coffee size={12}/> },
      hospital: { label: 'مستشفى', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <HeartPulse size={12}/> },
      health_center: { label: 'مركز صحي', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: <HeartPulse size={12}/> },
      pharmacy: { label: 'صيدلية', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <HeartPulse size={12}/> },
      university: { label: 'جامعة', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <GraduationCap size={12}/> },
    };
    return mapping[type] || { label: 'شخصي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <User size={12}/> };
  };

  // تجهيز بيانات شارت توزيع أعداد المستخدمين
  const accountDistributionData = stats?.typeCounts?.map(item => ({
    name: typeLabels[item._id] || item._id,
    count: item.count,
    color: typeColors[item._id] || '#cbd5e1'
  })) || [];

  // تجهيز بيانات شارت توزيع السيولة والأرصدة
  const liquidityData = stats?.typeBalances?.map(item => ({
    name: typeLabels[item._id] || item._id,
    value: item.balance,
    color: typeColors[item._id] || '#cbd5e1'
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">إدارة الحسابات والمستخدمين</h1>
        <p className="text-xs text-gray-400 font-bold">عرض وتصفية وتجميد حسابات الأفراد والتجار والشركات والمؤسسات الخدمية والتعليمية</p>
      </div>

      {/* كروت الإحصائيات الفخمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatCard 
          title="إجمالي الحسابات" 
          value={`${fmt(stats?.totalUsers)} حساب`} 
          subtext="المسجلة في النظام ككل"
          icon={<UsersIcon size={22} className="text-blue-400" />} 
          glowColor="bg-blue-500"
          loading={statsLoading} 
        />
        <UserStatCard 
          title="الحسابات النشطة" 
          value={`${fmt(stats?.activeUsers)} حساب`} 
          subtext={`يمثل نسبة ${activePercentage}% من الإجمالي`}
          icon={<CheckCircle2 size={22} className="text-emerald-400" />} 
          glowColor="bg-emerald-500"
          loading={statsLoading} 
        />
        <UserStatCard 
          title="إجمالي الودائع والسيولة" 
          value={`${fmt(stats?.totalBalances)} SDG`} 
          subtext="مجموع أرصدة المودعين بالنظام"
          icon={<DollarSign size={22} className="text-indigo-400" />} 
          glowColor="bg-indigo-500"
          loading={statsLoading} 
        />
        <UserStatCard 
          title="إجمالي عمليات النظام" 
          value={`${fmt(stats?.totalTransactions)} معاملة`} 
          subtext="العمليات المنفذة تاريخياً"
          icon={<Activity size={22} className="text-rose-400" />} 
          glowColor="bg-rose-500"
          loading={statsLoading} 
        />
      </div>

      {/* شارتات وتحليلات الحسابات والسيولة */}
      {!statsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* شارت توزيع أعداد الحسابات */}
          <div className="glass p-6 rounded-[30px] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">توزيع أعداد الحسابات حسب الفئة 📊</h3>
              <p className="text-[10px] text-gray-400">مقارنة حجم ونمو الحسابات المسجلة بكل قسم</p>
            </div>
            <div className="h-60 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountDistributionData}>
                  <XAxis dataKey="name" stroke="#8f8fa3" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8f8fa3" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: 'Cairo' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="عدد الحسابات">
                    {accountDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* شارت توزيع السيولة المودعة */}
          <div className="glass p-6 rounded-[30px] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">توزيع السيولة والأرصدة المودعة (SDG) 💰</h3>
              <p className="text-[10px] text-gray-400">حجم الأموال المودعة والمتاحة بكل فئة حساب</p>
            </div>
            <div className="h-48 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liquidityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {liquidityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString('ar-SA')} SDG`}
                    contentStyle={{ backgroundColor: '#122131', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: 'Cairo' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* دليل ألوان مخصص أسفل الشارت الدائري */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3 text-[10px] font-bold text-gray-400">
              {liquidityData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}: {((item.value / (stats?.totalBalances || 1)) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* شريط الأقسام (Tabs) الفخم كـ Segmented Control */}
      <div className="bg-white/5 border border-white/5 p-1 rounded-2xl flex flex-wrap gap-1 max-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id, tab.userType)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass p-6 rounded-[30px] border border-white/5 space-y-6">
        {/* شريط البحث الفخم */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-white/10 text-white rounded-2xl py-3 pr-11 pl-4 focus:ring-1 focus:ring-primary focus:border-transparent transition-all outline-none text-xs font-bold"
              placeholder="ابحث عن العميل بالاسم، البريد الإلكتروني، رقم الحساب أو معرف العميل..." 
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl text-xs transition-colors shadow-md">بحث</button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={36}/></div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-bold">
            لا توجد حسابات مسجلة في هذا القسم {search && `مطابقة للبحث "${search}"`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-black tracking-wider">
                  <th className="pb-4 pr-4">العميل / المؤسسة</th>
                  <th className="pb-4">نوع الحساب</th>
                  <th className="pb-4">رقم الحساب (8 أرقام)</th>
                  <th className="pb-4">معرف العميل (12 رقم)</th>
                  <th className="pb-4">الرصيد المتاح</th>
                  <th className="pb-4">الحالة</th>
                  <th className="pb-4 pl-4 text-left">إجراءات الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const typeConfig = getUserTypeConfig(u.userType);
                  
                  let avatarIcon = <User size={16} className="text-blue-400" />;
                  if (u.userType === 'hospital' || u.userType === 'health_center' || u.userType === 'pharmacy') {
                    avatarIcon = <HeartPulse size={16} className="text-rose-400" />;
                  } else if (u.userType === 'merchant') {
                    avatarIcon = <Store size={16} className="text-amber-400" />;
                  } else if (u.userType === 'company') {
                    avatarIcon = <Building2 size={16} className="text-purple-400" />;
                  } else if (u.userType === 'restaurant') {
                    avatarIcon = <Utensils size={16} className="text-orange-400" />;
                  } else if (u.userType === 'cafe') {
                    avatarIcon = <Coffee size={16} className="text-pink-400" />;
                  } else if (u.userType === 'university') {
                    avatarIcon = <GraduationCap size={16} className="text-indigo-400" />;
                  }

                  return (
                    <tr key={u._id} className="hover:bg-white/[0.04] transition-colors group">
                      <td className="py-4 pr-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/users/${u._id}`)}>
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors shadow-inner">
                          {avatarIcon}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {u.firstName} {u.middleName} {u.lastName}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5" dir="ltr">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-300 font-bold font-mono" dir="ltr">{u.accountNumber}</td>
                      <td className="py-4 text-xs text-gray-400 font-mono" dir="ltr">{u.userId}</td>
                      <td className="py-4 text-sm font-black text-emerald-400 font-mono" dir="ltr">
                        {Number(u.balance).toLocaleString('ar-SA')} SDG
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          u.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                          {u.isActive ? 'نشط ومفعل' : 'موقوف / مجمد'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/users/${u._id}`)}
                            className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1 text-xs font-bold"
                            title="التفاصيل والتحليلات البيانية"
                          >
                            <Eye size={15} />
                            التفاصيل
                          </button>

                          <button 
                            onClick={() => handleToggle(u._id, u.isActive)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              u.isActive 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30'
                            }`}
                          >
                            {u.isActive ? 'تجميد' : 'تنشيط'}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="p-1.5 rounded-xl text-rose-400 border border-transparent hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center group/delete"
                            title="حذف الحساب نهائياً"
                          >
                            <Trash2 size={16} className="group-hover/delete:scale-110 transition-transform" />
                          </button>
                        </div>
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
            <p>صفحة {page} من {pages} (إجمالي المسجلين: {total} عميل)</p>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1} 
                onClick={() => { setPage(p => p-1); load(p-1, search); }}
                className="px-3 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 flex items-center gap-1 transition-all"
              >
                <ChevronRight size={14}/> السابق
              </button>
              <button 
                disabled={page >= pages} 
                onClick={() => { setPage(p => p+1); load(p+1, search); }}
                className="px-3 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 flex items-center gap-1 transition-all"
              >
                التالي <ChevronLeft size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
