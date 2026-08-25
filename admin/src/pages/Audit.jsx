import React, { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, Loader2, ArrowRightLeft, UserCheck, UserX, PlusCircle, ShieldAlert } from 'lucide-react';
import { getAuditLog } from '../api';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAuditLog({ page, limit: 50 });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const actionConfig = {
    ACTIVATE_USER: { label: 'تنشيط مستخدم', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <UserCheck size={14} /> },
    BLOCK_USER: { label: 'حظر مستخدم', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <UserX size={14} /> },
    REVERSE_TRANSACTION: { label: 'عكس معاملة مالية', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <ArrowRightLeft size={14} /> },
    CREATE_ADMIN: { label: 'إنشاء حساب إداري', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <PlusCircle size={14} /> },
    CREATE_BRANCH: { label: 'إنشاء فرع جديد', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <PlusCircle size={14} /> },
  };

  const getActionDetails = (log) => {
    const config = actionConfig[log.action] || { label: log.action, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <ShieldAlert size={14} /> };
    return config;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">سجل المراجعة والرقابة (Audit Trail)</h1>
          <p className="text-sm text-gray-400">سجل كامل بجميع عمليات وإجراءات المسؤولين داخل لوحة التحكم لأغراض الرقابة</p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث السجل
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 bg-white/5">
                  <th className="p-4 font-semibold">المسؤول</th>
                  <th className="p-4 font-semibold">الإجراء المتخذ</th>
                  <th className="p-4 font-semibold">نوع المستهدف</th>
                  <th className="p-4 font-semibold">معرف المستهدف</th>
                  <th className="p-4 font-semibold">التفاصيل</th>
                  <th className="p-4 font-semibold">الوقت والتاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => {
                    const actionInfo = getActionDetails(log);
                    return (
                      <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="p-4">
                          <p className="font-bold text-white">{log.adminName}</p>
                          <p className="text-[10px] text-gray-500">ID: {log.adminId}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 w-max ${actionInfo.color}`}>
                            {actionInfo.icon}
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="p-4 capitalize text-gray-300 font-medium">{log.targetType}</td>
                        <td className="p-4 font-mono text-gray-400">{log.targetId || '—'}</td>
                        <td className="p-4">
                          <pre className="font-mono text-[10px] bg-black/30 p-2 rounded-lg border border-white/5 max-w-xs overflow-x-auto text-gray-300">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                        <td className="p-4 text-gray-400 font-medium">
                          {new Date(log.createdAt).toLocaleString('ar-SA')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-10">
                      سجل المراجعة فارغ تماماً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* الترقيم (Pagination) */}
          {total > 50 && (
            <div className="flex justify-between items-center p-4 border-t border-white/5 bg-white/5 text-xs">
              <span className="text-gray-400">إجمالي السجلات: {total}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white/5 text-white rounded-lg disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="px-3 py-1.5 text-gray-400 bg-white/5 rounded-lg font-bold">
                  الصفحة {page} من {Math.ceil(total / 50)}
                </span>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 50)}
                  className="px-3 py-1.5 bg-white/5 text-white rounded-lg disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
