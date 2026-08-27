import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ShieldAlert, CheckCircle2, Lock, X, RefreshCw } from 'lucide-react';
import { getNfcCards, createNfcCard, updateNfcCardStatus, getUsers } from '../api';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  
  const [newCard, setNewCard] = useState({ cardId: '', user: '', type: 'Physical' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCards();
    loadUsers();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await getNfcCards();
      setCards(res.cards || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers({ limit: 100 });
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCard.cardId || !newCard.user) return alert('الرجاء تعبئة جميع الحقول');
    setIsSubmitting(true);
    try {
      await createNfcCard(newCard);
      alert('✅ تم إصدار البطاقة بنجاح');
      setShowModal(false);
      setNewCard({ cardId: '', user: '', type: 'Physical' });
      loadCards();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const confirmMsg = currentStatus === 'Active' ? 'هل أنت متأكد من إيقاف هذه البطاقة؟' : 'هل أنت متأكد من تنشيط هذه البطاقة؟';
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await updateNfcCardStatus(id, newStatus);
      loadCards();
    } catch (e) {
      alert(e.message);
    }
  };

  const activeCardsCount = cards.filter(c => c.status === 'Active').length;
  const virtualCardsCount = cards.filter(c => c.type === 'Virtual').length;
  const suspendedCardsCount = cards.filter(c => c.status === 'Suspended' || c.status === 'Lost').length;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة بطاقات NFC</h1>
          <p className="text-sm text-gray-400">إصدار، إيقاف، ومراقبة البطاقات الفعلية والافتراضية المرتبطة بالمستخدمين</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          إصدار بطاقة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-emerald-500">
          <h3 className="text-gray-400 text-sm mb-2">إجمالي البطاقات النشطة</h3>
          <p className="text-3xl font-bold text-white">{activeCardsCount}</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-primary">
          <h3 className="text-gray-400 text-sm mb-2">بطاقات افتراضية (Virtual)</h3>
          <p className="text-3xl font-bold text-white">{virtualCardsCount}</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 border-l-4 border-l-rose-500">
          <h3 className="text-gray-400 text-sm mb-2">بطاقات موقوفة/مفقودة</h3>
          <p className="text-3xl font-bold text-white">{suspendedCardsCount}</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-10 text-center text-gray-400">جاري التحميل...</div>
          ) : cards.length === 0 ? (
             <div className="py-10 text-center text-gray-400">لا توجد بطاقات مصدرة حتى الآن.</div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-3 font-semibold">رقم البطاقة (ID)</th>
                  <th className="pb-3 font-semibold">المالك</th>
                  <th className="pb-3 font-semibold">رقم الحساب</th>
                  <th className="pb-3 font-semibold">نوع البطاقة</th>
                  <th className="pb-3 font-semibold">تاريخ الإصدار</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm font-medium text-gray-300 flex items-center gap-2" dir="ltr">
                      <CreditCard size={16} className="text-primary"/> {card.cardId}
                    </td>
                    <td className="py-4 text-sm font-semibold text-white">
                      {card.user ? card.user.firstName + ' ' + card.user.lastName : 'مستخدم محذوف'}
                    </td>
                    <td className="py-4 text-sm text-gray-400 font-mono" dir="ltr">{card.user?.accountNumber || '-'}</td>
                    <td className="py-4 text-sm text-gray-400">{card.type}</td>
                    <td className="py-4 text-sm text-gray-400" dir="ltr">{new Date(card.issueDate).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={${""}inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        {card.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'}}
                      >
                        {card.status === 'Active' ? <CheckCircle2 size={12}/> : <Lock size={12}/>}
                        {card.status === 'Active' ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="py-4 text-sm flex gap-2">
                      {card.status === 'Active' ? (
                        <button 
                          onClick={() => handleToggleStatus(card._id, card.status)}
                          className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs"
                        >
                          <ShieldAlert size={14} /> إيقاف
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleStatus(card._id, card.status)}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1 text-xs"
                        >
                          <RefreshCw size={14} /> تنشيط
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="glass p-6 rounded-3xl border border-white/10 w-full max-w-md animate-scale-up space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">إصدار بطاقة جديدة</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">رقم البطاقة التسلسلي (ID)</label>
              <input 
                required 
                value={newCard.cardId} 
                onChange={e => setNewCard({...newCard, cardId: e.target.value})}
                className="w-full bg-surface border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-primary font-mono text-left"
                placeholder="NFC-XXXXXX"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">المستخدم المالك للبطاقة</label>
              <select 
                required 
                value={newCard.user} 
                onChange={e => setNewCard({...newCard, user: e.target.value})}
                className="w-full bg-surface border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">-- اختر المستخدم --</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.accountNumber})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">نوع البطاقة</label>
              <select 
                value={newCard.type} 
                onChange={e => setNewCard({...newCard, type: e.target.value})}
                className="w-full bg-surface border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="Physical">بطاقة فعلية (Physical)</option>
                <option value="Virtual">بطاقة افتراضية (Virtual)</option>
                <option value="Bracelet">سوار NFC (Bracelet)</option>
              </select>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الإصدار...' : 'تأكيد وإصدار البطاقة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
