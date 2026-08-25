import React, { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle2, AlertCircle, RefreshCw, Power, Key, Link as LinkIcon, Clock, ShieldCheck, Zap } from 'lucide-react';
import { getBankGateways, createBankGateway, updateBankGateway, testBankGateway } from '../api';

export default function BankSettings() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsedTx, setTotalUsedTx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    apiUrl: '',
    apiKey: '',
    merchantAccount: '',
    validityHours: 6,
    instructions: 'قم بتحويل المبلغ إلى رقم الحساب الموضح أدناه عبر تطبيق البنك، ثم ادخل رقم العملية لمطابقتها لشحن رصيدك فورا.',
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await getBankGateways();
      if (res.success) {
        setGateways(res.gateways || []);
        setTotalUsedTx(res.totalUsedTransactions || 0);
      }
    } catch (err) {
      console.error('Error fetching gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingGateway(null);
    setFormData({
      name: '',
      code: '',
      apiUrl: '',
      apiKey: '',
      merchantAccount: '',
      validityHours: 6,
      instructions: 'قم بتحويل المبلغ إلى رقم الحساب الموضح أدناه عبر تطبيق البنك، ثم ادخل رقم العملية لمطابقتها لشحن رصيدك فورا.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gw) => {
    setEditingGateway(gw);
    setFormData({
      name: gw.name || '',
      code: gw.code || '',
      apiUrl: gw.apiUrl || '',
      apiKey: gw.apiKey || '',
      merchantAccount: gw.merchantAccount || '',
      validityHours: gw.validityHours || 6,
      instructions: gw.instructions || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (gw) => {
    try {
      const updatedStatus = !gw.isActive;
      const res = await updateBankGateway(gw._id, { isActive: updatedStatus });
      if (res.success) {
        setGateways(gateways.map(g => g._id === gw._id ? { ...g, isActive: updatedStatus } : g));
      }
    } catch (err) {
      alert('حدث خطأ أثناء تعديل حالة البنك');
    }
  };

  const handleTestConnection = async (gw) => {
    setTestingId(gw._id);
    setTestResult(null);
    try {
      const res = await testBankGateway(gw._id);
      if (res.success) {
        setTestResult({
          gwId: gw._id,
          success: true,
          message: res.message,
          latency: res.latencyMs
        });
      }
    } catch (err) {
      setTestResult({
        gwId: gw._id,
        success: false,
        message: err.message || 'فشل الاتصال بسيرفر البنك'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGateway) {
        const res = await updateBankGateway(editingGateway._id, formData);
        if (res.success) {
          setIsModalOpen(false);
          fetchGateways();
        }
      } else {
        const res = await createBankGateway(formData);
        if (res.success) {
          setIsModalOpen(false);
          fetchGateways();
        }
      }
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ بيانات البنك');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Building2 size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">إعدادات ربط البنوك (Bank Integrations)</h1>
          </div>
          <p className="text-sm text-gray-400">إدارة مفاتيح API، روابط الخوادم، وسجل حظر التكرار البنكي</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-xl text-xs text-gray-300 border border-white/5 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>العمليات الموثقة والمحصورة: <strong className="text-white">{totalUsedTx} عملية</strong></span>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            إضافة بنك جديد
          </button>
        </div>
      </div>

      {/* Expiration Rule Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900/60 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl mt-0.5">
          <Clock size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            ضوابط الأمان والصلاحية الزمنية للعمليات البنكية
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-mono">6 HOURS EXPIRATION</span>
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            جميع أرقام العمليات القادمة من البنوك (مثل بنكك) خاضعة لـ <strong>مهلة صلاحية 6 ساعات فقط</strong>، ويتم تسجيل أي رقم يُستخدم في جدول فريد لمنع تكراره نهائياً. في حال تجاوز المهلة، يتم إلغاء التغذية وتمرير إشعار إرجاع واسترداد الأموال لحساب البنك الأصلي.
          </p>
        </div>
      </div>

      {/* Bank Gateways Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map((gw) => (
            <div
              key={gw._id}
              className={`glass p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                gw.isActive ? 'border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'border-white/5 opacity-75'
              }`}
            >
              <div>
                {/* Top Row: Name & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded-md uppercase">
                      {gw.code}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{gw.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(gw)}
                    title={gw.isActive ? 'إيقاف البوابة' : 'تفعيل البوابة'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      gw.isActive ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        gw.isActive ? '-translate-x-6' : '-translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs text-gray-300 my-4 bg-black/20 p-3.5 rounded-xl border border-white/5 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-sans flex items-center gap-1">
                      <LinkIcon size={12} /> رابط API:
                    </span>
                    <span className="text-blue-400 truncate max-w-[170px]" title={gw.apiUrl || 'غير محدد'}>
                      {gw.apiUrl || 'محلي (Mock Server)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-sans flex items-center gap-1">
                      <Building2 size={12} /> حساب التجميع:
                    </span>
                    <span className="text-emerald-400 font-bold">{gw.merchantAccount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-sans flex items-center gap-1">
                      <Clock size={12} /> مهلة الصلاحية:
                    </span>
                    <span className="text-amber-400 font-bold">{gw.validityHours || 6} ساعات</span>
                  </div>
                </div>
              </div>

              {/* Test Result Toast */}
              {testResult && testResult.gwId === gw._id && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border animate-fade-in ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border-red-500/20'
                  }`}
                >
                  {testResult.success ? <Zap size={16} /> : <AlertCircle size={16} />}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.latency && <p className="text-[10px] opacity-75">زمن الاستجابة: {testResult.latency}ms</p>}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleTestConnection(gw)}
                  disabled={testingId === gw._id}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-200 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                >
                  {testingId === gw._id ? (
                    <RefreshCw size={14} className="animate-spin text-emerald-400" />
                  ) : (
                    <Zap size={14} className="text-emerald-400" />
                  )}
                  اختبار الربط ⚡
                </button>

                <button
                  onClick={() => handleOpenEditModal(gw)}
                  className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold transition-colors border border-blue-500/20"
                >
                  تعديل ✏️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Gateway Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass bg-[#12141C] p-6 rounded-3xl border border-white/10 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="text-emerald-400" />
                {editingGateway ? `تعديل بنك (${editingGateway.name})` : 'إضافة بوابة بنكية جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">اسم البنك</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بنك الخرطوم (بنكك)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">كود البنك (Bank Code)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingGateway}
                    placeholder="مثال: BANKAK"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none uppercase font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">رقم حساب التجميع بالبنك</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 3128941"
                    value={formData.merchantAccount}
                    onChange={(e) => setFormData({ ...formData, merchantAccount: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">مهلة الصلاحية (بالساعات)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    required
                    value={formData.validityHours}
                    onChange={(e) => setFormData({ ...formData, validityHours: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">رابط API السيرفر (API Endpoint)</label>
                <input
                  type="url"
                  placeholder="https://api.bankofkhartoum.com/v1/verify"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">مفتاح API الخاص بالنظام (API Key / Token)</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">تعليمات الشحن للعميل</label>
                <textarea
                  rows="2"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
