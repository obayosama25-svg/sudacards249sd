import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, ArrowRightLeft } from 'lucide-react';
import { getDevices } from '../api';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getDevices();
        setDevices(res.devices || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            سجل الأجهزة
          </h1>
          <p className="text-white/60 mt-2">تتبع جميع الأجهزة التي تم استخدامها للدخول إلى النظام</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Smartphone size={18} className="text-primary" />
            قائمة الأجهزة ({devices.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-white/50">جاري تحميل البيانات...</div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-6 py-4 font-medium">معرف الجهاز (Device ID)</th>
                  <th className="px-6 py-4 font-medium">عدد الحسابات المرتبطة تاريخياً</th>
                  <th className="px-6 py-4 font-medium">عدد عمليات النقل</th>
                  <th className="px-6 py-4 font-medium">آخر تحديث</th>
                  <th className="px-6 py-4 font-medium text-left">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {devices.map(device => (
                  <tr key={device._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Smartphone size={14} className="text-primary" />
                        </div>
                        <span className="text-white font-mono">{device.deviceId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80">
                      {device.history?.length || 0} حسابات
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <ArrowRightLeft size={14} className="text-primary" />
                        {device.transferCount} نقل
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {new Date(device.updatedAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <Link 
                        to={`/dashboard/devices/${device.deviceId}`}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors inline-block"
                      >
                        عرض السجل
                      </Link>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-white/50">
                      لا توجد أجهزة مسجلة في النظام
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Devices;
