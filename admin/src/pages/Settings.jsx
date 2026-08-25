import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Power, Percent, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const [modules, setModules] = useState([
    { id: 'transfer', name: 'التحويل المالي', enabled: true, fee: '1%', type: 'percentage' },
    { id: 'telecom', name: 'شحن الرصيد (اتصالات)', enabled: true, fee: '0', type: 'fixed' },
    { id: 'electricity', name: 'شراء الكهرباء', enabled: true, fee: '0', type: 'fixed' },
    { id: 'education', name: 'رسوم التعليم', enabled: true, fee: '200 SDG', type: 'fixed' },
    { id: 'airlines', name: 'تذاكر الطيران', enabled: false, fee: '5%', type: 'percentage' },
  ]);

  const toggleModule = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إعدادات النظام</h1>
          <p className="text-sm text-gray-400">التحكم في تشغيل الخدمات وضبط الرسوم والعمولات</p>
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Save size={18} />
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Configuration */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Power className="text-primary" />
            <h2 className="text-lg font-bold text-white">حالة الخدمات (Modules)</h2>
          </div>
          <div className="space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
                <div>
                  <h3 className="font-semibold text-white">{mod.name}</h3>
                  <p className="text-xs text-gray-400">إيقاف أو تشغيل هذه الخدمة للمستخدمين</p>
                </div>
                <button 
                  onClick={() => toggleModule(mod.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mod.enabled ? 'bg-primary' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mod.enabled ? '-translate-x-6' : '-translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fees Configuration */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Percent className="text-primary" />
            <h2 className="text-lg font-bold text-white">رسوم وعمولات الخدمات</h2>
          </div>
          <div className="space-y-4">
            {modules.map((mod) => (
              <div key={`fee-${mod.id}`} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
                <span className="font-semibold text-white text-sm">{mod.name}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    defaultValue={mod.fee} 
                    className="w-24 bg-surface border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm text-center focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Security Settings */}
        <div className="glass p-6 rounded-2xl border border-white/5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <ShieldCheck className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">إعدادات الأمان</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface/50 border border-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">المصادقة الثنائية (2FA) لمديري النظام</h3>
              <p className="text-sm text-gray-400 mb-4">إجبار جميع المشرفين على استخدام تطبيق Authenticator.</p>
              <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors">
                مفعل حالياً
              </button>
            </div>
            <div className="p-4 bg-surface/50 border border-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">حد التحويل اليومي</h3>
              <p className="text-sm text-gray-400 mb-4">الحد الأقصى المسموح به للتحويلات في اليوم للمستخدم العادي.</p>
              <input 
                type="text" 
                defaultValue="5,000,000 SDG" 
                className="w-full bg-surface border border-gray-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
