import React, { useEffect, useState } from 'react';
import { Building2, Users, Plus, Shield, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { getBranches, createBranch, getAdmins, createAdmin } from '../api';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals visibility
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Form states
  const [branchForm, setBranchForm] = useState({ branchCode: '', name: '', address: '', phone: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '', email: '', fullName: '', role: 'teller', branchId: '', dailyTransferLimit: '500000' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchRes, adminRes] = await Promise.all([
        getBranches(),
        getAdmins()
      ]);
      setBranches(branchRes.data || []);
      setAdmins(adminRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBranch(branchForm);
      alert('تم إنشاء الفرع بنجاح ✅');
      setShowBranchModal(false);
      setBranchForm({ branchCode: '', name: '', address: '', phone: '' });
      loadData();
    } catch (e) {
      alert(e.message || 'فشل إنشاء الفرع');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...adminForm,
        dailyTransferLimit: Number(adminForm.dailyTransferLimit)
      };
      await createAdmin(data);
      alert('تم إنشاء حساب الموظف بنجاح ✅');
      setShowAdminModal(false);
      setAdminForm({ username: '', password: '', email: '', fullName: '', role: 'teller', branchId: '', dailyTransferLimit: '500000' });
      loadData();
    } catch (e) {
      alert(e.message || 'فشل إنشاء الحساب');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels = { superadmin: 'المدير العام', manager: 'مدير فرع', teller: 'موظف' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">الفروع والصلاحيات</h1>
          <p className="text-sm text-gray-400">إدارة شبكة فروع SudaCards وحسابات المشرفين والموظفين</p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* قسم إدارة الفروع */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                فروع البنك والشركة ({branches.length})
              </h2>
              <button 
                onClick={() => setShowBranchModal(true)}
                className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
              >
                <Plus size={16} />
                أضف فرع
              </button>
            </div>

            <div className="space-y-3">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <div key={branch.branchCode} className="glass p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-sm">{branch.name}</h3>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded-lg font-mono font-bold">
                        {branch.branchCode}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>العنوان: {branch.address || '—'}</p>
                      <p>الهاتف: {branch.phone || '—'}</p>
                      <p className="text-[10px] text-gray-500 mt-2">
                        المدير: {branch.managerId?.fullName || 'لم يعين بعد'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">لا توجد فروع مسجلة</p>
              )}
            </div>
          </div>

          {/* قسم إدارة المشرفين والموظفين */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                المشرفون وموظفو الصراف المالي ({admins.length})
              </h2>
              <button 
                onClick={() => setShowAdminModal(true)}
                className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
              >
                <Plus size={16} />
                أضف موظف / مشرف
              </button>
            </div>

            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 bg-white/5">
                      <th className="p-4 font-semibold">الاسم بالكامل</th>
                      <th className="p-4 font-semibold">اسم المستخدم</th>
                      <th className="p-4 font-semibold">البريد الإلكتروني</th>
                      <th className="p-4 font-semibold">الصلاحية</th>
                      <th className="p-4 font-semibold">الفرع</th>
                      <th className="p-4 font-semibold">سقف التحويل اليومي</th>
                      <th className="p-4 font-semibold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length > 0 ? (
                      admins.map((admin) => (
                        <tr key={admin.username} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4 font-bold text-white">{admin.fullName}</td>
                          <td className="p-4 font-mono">{admin.username}</td>
                          <td className="p-4">{admin.email}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              admin.role === 'superadmin' ? 'bg-red-500/10 text-red-400' :
                              admin.role === 'manager' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-green-500/10 text-green-400'
                            }`}>
                              {roleLabels[admin.role] || admin.role}
                            </span>
                          </td>
                          <td className="p-4">{admin.branchId === 'HEAD_QUARTERS' ? 'الإدارة العامة' : admin.branchId}</td>
                          <td className="p-4 font-bold text-white">
                            {admin.dailyTransferLimit > 0 ? `${admin.dailyTransferLimit.toLocaleString('ar-SA')} SDG` : 'غير محدود'}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check size={14} />
                              نشط
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-gray-500 py-10">
                          لا يوجد موظفون مسجلون
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال إنشاء فرع جديد */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">إضافة فرع جديد</h3>
              <button onClick={() => setShowBranchModal(false)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleBranchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">رمز الفرع (الكود):</label>
                <input 
                  type="text" 
                  value={branchForm.branchCode}
                  onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase() })}
                  placeholder="مثال: KRT-001"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">اسم الفرع:</label>
                <input 
                  type="text" 
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="مثال: فرع الخرطوم بحري"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">العنوان:</label>
                <input 
                  type="text" 
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="الشارع، الحي"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">رقم الهاتف:</label>
                <input 
                  type="text" 
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="رقم الهاتف للتواصل"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all">
                  {submitting ? 'جاري الإنشاء...' : 'حفظ الفرع'}
                </button>
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2.5 bg-white/5 text-white rounded-xl text-xs">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إنشاء مشرف جديد */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">إضافة موظف / مشرف جديد</h3>
              <button onClick={() => setShowAdminModal(false)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">الاسم الكامل:</label>
                <input 
                  type="text" 
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  placeholder="الاسم الثلاثي"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">اسم المستخدم:</label>
                  <input 
                    type="text" 
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().trim() })}
                    placeholder="username"
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">كلمة المرور:</label>
                  <input 
                    type="password" 
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">البريد الإلكتروني:</label>
                <input 
                  type="email" 
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الصلاحية:</label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    className="w-full bg-[#122131] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="teller">موظف (Teller)</option>
                    <option value="manager">مدير فرع (Manager)</option>
                    <option value="superadmin">مدير عام (Superadmin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الفرع المرتبط:</label>
                  <select
                    value={adminForm.branchId}
                    onChange={(e) => setAdminForm({ ...adminForm, branchId: e.target.value })}
                    required
                    className="w-full bg-[#122131] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">اختر الفرع...</option>
                    <option value="HEAD_QUARTERS">الإدارة العامة</option>
                    {branches.map(b => (
                      <option key={b.branchCode} value={b.branchCode}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">سقف التحويل اليومي المسموح (SDG):</label>
                <input 
                  type="number" 
                  value={adminForm.dailyTransferLimit}
                  onChange={(e) => setAdminForm({ ...adminForm, dailyTransferLimit: e.target.value })}
                  placeholder="سقف الصلاحية للعملية الواحدة"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all">
                  {submitting ? 'جاري الحفظ...' : 'إنشاء الحساب'}
                </button>
                <button type="button" onClick={() => setShowAdminModal(false)} className="px-4 py-2.5 bg-white/5 text-white rounded-xl text-xs">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
