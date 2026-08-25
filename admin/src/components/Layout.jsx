import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, Settings, LogOut,
  Bell, Search, Activity, Building2, Shield, FileText, DollarSign, UserCheck
} from 'lucide-react';
import { getPendingCount } from '../api';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sudacards_user') || '{}');
  const role = user.role || 'teller';
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role === 'superadmin' || role === 'manager') {
      async function fetchCount() {
        try {
          const res = await getPendingCount();
          setPendingCount(res.count || 0);
        } catch(e) {
          console.error(e);
        }
      }
      fetchCount();
      const interval = setInterval(fetchCount, 15000); // تحديث كل 15 ثانية للسرعة
      return () => clearInterval(interval);
    }
  }, [role]);

  const allMenuItems = [
    { name: 'الرئيسية', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['superadmin', 'manager', 'teller'] },
    { name: 'المستخدمين', path: '/dashboard/users', icon: <Users size={20} />, roles: ['superadmin', 'manager', 'teller'] },
    { name: 'طلبات التسجيل', path: '/dashboard/reviews', icon: <UserCheck size={20} />, roles: ['superadmin', 'manager'] },
    { name: 'المعاملات المالية', path: '/dashboard/transactions', icon: <Activity size={20} />, roles: ['superadmin', 'manager', 'teller'] },
    { name: 'الإيرادات والمطابقة', path: '/dashboard/revenue', icon: <DollarSign size={20} />, roles: ['superadmin'] },
    { name: 'بطاقات NFC', path: '/dashboard/cards', icon: <CreditCard size={20} />, roles: ['superadmin', 'manager'] },
    { name: 'الفروع والصلاحيات', path: '/dashboard/branches', icon: <Building2 size={20} />, roles: ['superadmin'] },
    { name: 'سجل المراجعة', path: '/dashboard/audit', icon: <FileText size={20} />, roles: ['superadmin'] },
    { name: 'ربط البنوك (APIs)', path: '/dashboard/bank-settings', icon: <Building2 size={20} />, roles: ['superadmin', 'manager'] },
    { name: 'سجل الأجهزة', path: '/dashboard/devices', icon: <Shield size={20} />, roles: ['superadmin'] },
    { name: 'الإعدادات', path: '/dashboard/settings', icon: <Settings size={20} />, roles: ['superadmin'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('sudacards_token');
    localStorage.removeItem('sudacards_user');
    navigate('/login');
  };

  const roleLabels = { superadmin: 'المدير العام', manager: 'مدير فرع', teller: 'موظف' };

  return (
    <div className="w-64 glass h-screen fixed right-0 top-0 border-l border-white/5 flex flex-col z-20">
      <div className="p-6 text-center border-b border-white/5">
        <h2 className="text-2xl font-bold text-white tracking-wider">SudaCards</h2>
        <p className="text-xs text-primary mt-1">لوحة تحكم الإدارة</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_4px_15px_rgba(45,70,255,0.4)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {item.path === '/dashboard/reviews' && pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm">
            {user.fullName?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.fullName || 'المدير'}</p>
            <p className="text-[11px] text-gray-400">{roleLabels[role]}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">تسجيل خروج</span>
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <header className="h-16 glass fixed top-0 left-0 right-64 border-b border-white/5 flex items-center justify-between px-8 z-10">
      <div className="relative w-80">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full bg-surface/50 border border-gray-700 text-white rounded-full py-2 pr-10 pl-4 focus:ring-1 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
          placeholder="ابحث عن مستخدم، معاملة..."
        />
      </div>
      <button className="relative text-gray-400 hover:text-white transition-colors">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    </header>
  );
};

export default function Layout() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('sudacards_token')) navigate('/login');
  }, []);

  return (
    <div className="h-screen bg-background text-white flex overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col relative z-0">
        <Header />
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
