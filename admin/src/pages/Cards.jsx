import React from 'react';
import { CreditCard, Plus, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

const cardsData = [
  { id: 'NFC-101', user: 'أحمد محمد', type: 'بطاقة فعلية (Physical)', status: 'نشط', issueDate: '2025-12-01', lastUsed: '2026-07-15' },
  { id: 'NFC-102', user: 'سارة خالد', type: 'بطاقة افتراضية (Virtual)', status: 'نشط', issueDate: '2026-01-10', lastUsed: '2026-07-16' },
  { id: 'NFC-103', user: 'عمر عثمان', type: 'بطاقة فعلية (Physical)', status: 'مفقود/موقوف', issueDate: '2026-03-22', lastUsed: '2026-06-30' },
  { id: 'NFC-104', user: 'فاطمة علي', type: 'سوار NFC', status: 'نشط', issueDate: '2026-05-05', lastUsed: '2026-07-10' },
];

export default function Cards() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة بطاقات NFC</h1>
          <p className="text-sm text-gray-400">إصدار، إيقاف، ومراقبة البطاقات الفعلية والافتراضية المرتبطة بالمستخدمين</p>
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Plus size={18} />
          إصدار بطاقة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-emerald-500">
          <h3 className="text-gray-400 text-sm mb-2">إجمالي البطاقات النشطة</h3>
          <p className="text-3xl font-bold text-white">8,234</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-primary">
          <h3 className="text-gray-400 text-sm mb-2">بطاقات افتراضية (Virtual)</h3>
          <p className="text-3xl font-bold text-white">5,102</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-rose-500">
          <h3 className="text-gray-400 text-sm mb-2">بطاقات موقوفة/مفقودة</h3>
          <p className="text-3xl font-bold text-white">142</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="pb-3 font-semibold">رقم البطاقة (ID)</th>
                <th className="pb-3 font-semibold">المالك</th>
                <th className="pb-3 font-semibold">نوع البطاقة</th>
                <th className="pb-3 font-semibold">تاريخ الإصدار</th>
                <th className="pb-3 font-semibold">آخر استخدام</th>
                <th className="pb-3 font-semibold">الحالة</th>
                <th className="pb-3 font-semibold">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody>
              {cardsData.map((card) => (
                <tr key={card.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm font-medium text-gray-300 flex items-center gap-2" dir="ltr">
                    <CreditCard size={16} className="text-primary"/> {card.id}
                  </td>
                  <td className="py-4 text-sm font-semibold text-white">{card.user}</td>
                  <td className="py-4 text-sm text-gray-400">{card.type}</td>
                  <td className="py-4 text-sm text-gray-400" dir="ltr">{card.issueDate}</td>
                  <td className="py-4 text-sm text-gray-400" dir="ltr">{card.lastUsed}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                      ${card.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                    >
                      {card.status === 'نشط' ? <CheckCircle2 size={12}/> : <Lock size={12}/>}
                      {card.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm flex gap-2">
                    {card.status === 'نشط' && (
                      <button className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs">
                        <ShieldAlert size={14} /> إيقاف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
