import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowRight, User, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { getDeviceDetails } from '../api';

const DeviceDetails = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getDeviceDetails(id);
        setDevice(res.device);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-white/50 text-center">جاري تحميل السجل...</div>;
  if (!device) return <div className="p-8 text-white/50 text-center">الجهاز غير موجود</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard/devices" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            سجل الجهاز (Timeline)
          </h1>
          <p className="text-white/60 mt-1 font-mono text-sm">{device.deviceId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl flex items-center gap-4 border-l-4 border-primary">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-white/60 text-sm">أول ظهور في النظام</p>
            <p className="text-white font-bold text-lg mt-1">
              {new Date(device.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
        
        <div className="glass p-6 rounded-2xl flex items-center gap-4 border-l-4 border-[#ff4757]">
          <div className="w-12 h-12 rounded-full bg-[#ff4757]/20 flex items-center justify-center">
            <LogOut size={24} className="text-[#ff4757]" />
          </div>
          <div>
            <p className="text-white/60 text-sm">عمليات النقل / الإحلال</p>
            <p className="text-white font-bold text-lg mt-1">{device.transferCount}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center gap-4 border-l-4 border-[#2ed573]">
          <div className="w-12 h-12 rounded-full bg-[#2ed573]/20 flex items-center justify-center">
            <User size={24} className="text-[#2ed573]" />
          </div>
          <div>
            <p className="text-white/60 text-sm">إجمالي الحسابات التي مرت عليه</p>
            <p className="text-white font-bold text-lg mt-1">{device.history?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
          الخط الزمني للحسابات (Account Timeline)
        </h3>
        
        <div className="relative border-r-2 border-white/10 pr-6 ml-4 space-y-8">
          {device.history?.slice().reverse().map((record, index) => (
            <div key={index} className="relative">
              {/* Timeline Dot */}
              <div className={`absolute -right-[33px] top-1 w-4 h-4 rounded-full border-4 border-[#0a0f1c] ${!record.unlinkedAt ? 'bg-primary' : 'bg-white/30'}`}></div>
              
              <div className={`p-5 rounded-xl border ${!record.unlinkedAt ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      {record.name}
                      {!record.unlinkedAt && (
                        <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary border border-primary/20 flex items-center gap-1">
                          <CheckCircle2 size={12} /> الحساب الحالي النشط
                        </span>
                      )}
                    </h4>
                    <p className="text-white/60 font-mono text-sm mt-1">رقم الحساب: {record.accountNumber}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-[#0a0f1c]/50">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-primary" />
                    <div>
                      <p className="text-xs text-white/50">تاريخ الارتباط</p>
                      <p className="text-sm text-white/90">{new Date(record.linkedAt).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                  
                  {record.unlinkedAt && (
                    <div className="flex items-center gap-3">
                      <LogOut size={16} className="text-[#ff4757]" />
                      <div>
                        <p className="text-xs text-white/50">تاريخ فك الارتباط</p>
                        <p className="text-sm text-[#ff4757]">{new Date(record.unlinkedAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {(!device.history || device.history.length === 0) && (
            <div className="text-white/50 text-center py-8">لا توجد سجلات حسابات لهذا الجهاز</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
