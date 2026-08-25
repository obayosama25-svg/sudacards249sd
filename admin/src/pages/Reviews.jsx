import React, { useEffect, useState } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '../api';
import { 
  Loader2, CheckCircle, XCircle, AlertCircle, FileText, 
  User, Mail, Calendar, ShieldAlert, ZoomIn, X,
  Phone, MapPin, Briefcase, Users, Lock, Key, ShieldCheck, Fingerprint
} from 'lucide-react';


/* ==========================================
   DYNAMIC DOCUMENT GENERATOR (SVG MOCKUPS)
   ========================================== */
function DocumentCard({ req, onZoom, isZoomedView = false }) {
  const isPersonal = req.userType === 'personal';
  const fullName = `${req.firstName} ${req.middleName || ''} ${req.lastName}`;

  if (isPersonal) {
    return (
      <div 
        onClick={!isZoomedView ? onZoom : undefined}
        className={`w-full aspect-[1.586/1] bg-gradient-to-br from-emerald-950 via-slate-900 to-zinc-950 rounded-2xl border border-emerald-500/20 p-5 shadow-2xl relative overflow-hidden select-none ${
          !isZoomedView ? 'cursor-pointer hover:border-emerald-400/40 hover:shadow-emerald-500/5 transition-all group' : ''
        }`}
      >
        {/* Holographic glowing accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-emerald-500/20 pb-3 mb-3">
          <div>
            <h5 className="text-[11px] font-black text-emerald-400">المملكة العربية السعودية</h5>
            <p className="text-[8px] text-gray-400">وزارة الداخلية - الأحوال المدنية</p>
          </div>
          <div className="text-left">
            <h5 className="text-[11px] font-black text-white">بطاقة الهوية الوطنية</h5>
            <p className="text-[8px] text-gray-500 font-mono">NATIONAL IDENTITY CARD</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex gap-5 items-center mt-2">
          {/* Mock Photo */}
          <div className="w-20 h-24 rounded-lg border border-emerald-500/20 bg-emerald-950/40 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
            <User size={38} className="text-emerald-500/30" />
            <div className="absolute bottom-1 w-full text-center text-[7px] text-emerald-400/60 font-mono">SECURE PHOTO</div>
          </div>

          {/* User details */}
          <div className="flex-1 space-y-2 text-right">
            <div>
              <span className="text-[8px] text-gray-400 block">الاسم الكامل / Name</span>
              <span className="text-xs font-bold text-white">{fullName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[8px] text-gray-400 block">رقم الهوية / ID No.</span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono" dir="ltr">{req.userId}</span>
              </div>
              <div>
                <span className="text-[8px] text-gray-400 block">تاريخ الميلاد / DOB</span>
                <span className="text-[10px] font-bold text-white font-mono" dir="ltr">
                  {new Date(req.dateOfBirth).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode & Ref-ID */}
        <div className="absolute bottom-3 left-5 right-5 flex justify-between items-end">
          <div className="text-[6px] text-gray-500 font-mono">ID-{req._id?.slice(-8).toUpperCase()}</div>
          <div className="flex gap-[1.5px] items-end h-5 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 opacity-60">
            {[1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1].map((w, i) => (
              <div key={i} className="bg-white/80 h-full" style={{ width: `${w}px` }}></div>
            ))}
          </div>
        </div>

        {/* Hover zoom cover overlay */}
        {!isZoomedView && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5">
            <ZoomIn size={22} className="text-white animate-bounce" />
            <span className="text-xs text-white font-bold">انقر لتكبير الهوية</span>
          </div>
        )}
      </div>
    );
  }

  // Corporate/Commercial License
  return (
    <div 
      onClick={!isZoomedView ? onZoom : undefined}
      className={`w-full aspect-[1.586/1] bg-gradient-to-br from-amber-950/20 via-slate-900 to-zinc-950 rounded-2xl border border-amber-500/20 p-5 shadow-2xl relative overflow-hidden select-none ${
        !isZoomedView ? 'cursor-pointer hover:border-amber-400/40 hover:shadow-amber-500/5 transition-all group' : ''
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
      <div className="absolute inset-2 border border-amber-500/10 rounded-xl pointer-events-none"></div>
      
      {/* Header */}
      <div className="text-center border-b border-amber-500/20 pb-2 mb-3">
        <h4 className="text-[10px] font-bold text-amber-500">وزارة التجارة والاستثمار</h4>
        <h3 className="text-xs font-black text-white mt-0.5">شهادة قيد السجل التجاري والترخيص</h3>
        <p className="text-[8px] text-gray-500 font-mono">COMMERCIAL REGISTRATION CERTIFICATE</p>
      </div>

      {/* Details layout */}
      <div className="space-y-2 text-right relative z-10 px-3 mt-3">
        <div className="flex justify-between text-[9px] border-b border-white/5 pb-1">
          <span className="text-gray-400">الاسم التجاري:</span>
          <span className="font-bold text-amber-400">{fullName}</span>
        </div>
        <div className="flex justify-between text-[9px] border-b border-white/5 pb-1">
          <span className="text-gray-400">رقم الحساب البنكي:</span>
          <span className="font-mono font-bold text-white" dir="ltr">{req.accountNumber}</span>
        </div>
        <div className="flex justify-between text-[9px] border-b border-white/5 pb-1">
          <span className="text-gray-400">الرقم الوطني للمنشأة:</span>
          <span className="font-mono font-bold text-white" dir="ltr">{req.userId}</span>
        </div>
        <div className="flex justify-between text-[9px] border-b border-white/5 pb-1">
          <span className="text-gray-400">تاريخ التأسيس:</span>
          <span className="font-bold text-white">
            {new Date(req.dateOfBirth).toLocaleDateString('ar-SA')}
          </span>
        </div>
      </div>

      {/* Official Gold Seal */}
      <div className="absolute bottom-4 left-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center relative rotate-12">
          <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center">
            <span className="text-[6px] font-bold text-amber-500/60 font-mono">SUDACARDS</span>
          </div>
        </div>
        <div className="text-left">
          <p className="text-[6px] text-gray-500 font-mono">REG-ID: {req._id?.slice(-8).toUpperCase()}</p>
          <p className="text-[6px] text-emerald-400 font-bold">DIGITALLY SECURED</p>
        </div>
      </div>

      {/* Hover zoom cover overlay */}
      {!isZoomedView && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5">
          <ZoomIn size={22} className="text-white animate-bounce" />
          <span className="text-xs text-white font-bold">انقر لتكبير الترخيص</span>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   MAIN COMPONENT
   ========================================== */
export default function Reviews() {
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');


  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingUsers();
      setRequests(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedReq(res.data[0]);
      } else {
        setSelectedReq(null);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من قبول هذا الحساب وتفعيله للعمل؟')) return;
    setActionLoading(true);
    try {
      await approveUser(id);
      alert('✅ تم قبول الحساب بنجاح وتفعيله.');
      loadRequests();
    } catch(e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('هل أنت متأكد من رفض طلب هذا الحساب؟')) return;
    setActionLoading(true);
    try {
      await rejectUser(id);
      alert('❌ تم رفض طلب التسجيل بنجاح.');
      loadRequests();
    } catch(e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const typeConfig = (type) => ({
    personal: { label: 'مستخدم عادي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    merchant: { label: 'تاجر', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    company: { label: 'شركة', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    restaurant: { label: 'مطعم', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    cafe: { label: 'كافيه', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    hospital: { label: 'مستشفى', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    health_center: { label: 'مركز صحي', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    pharmacy: { label: 'صيدلية', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    university: { label: 'جامعة', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  }[type] || { label: 'شخصي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' });

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'personal') return req.userType === 'personal';
    if (activeTab === 'company') return req.userType === 'company';
    return !['personal', 'company'].includes(req.userType);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">طلبات التسجيل والمراجعة</h1>
        <p className="text-sm text-gray-400">مراجعة والتحقق من حسابات المستخدمين والمؤسسات الجديدة وتفعيلها</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={36}/>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center space-y-3">
          <CheckCircle size={48} className="text-emerald-400 animate-bounce" />
          <h3 className="text-lg font-bold text-white">لا توجد طلبات معلقة</h3>
          <p className="text-sm text-gray-400">لقد تمت مراجعة جميع طلبات التسجيل المقدمة بالكامل!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* قائمة الطلبات (Master View) */}
          <div className="lg:col-span-4 glass rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col max-h-[700px] shadow-2xl">
            <div className="p-5 border-b border-white/10 bg-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white flex justify-between items-center">
                <span>الطلبات قيد الانتظار</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">{filteredRequests.length}</span>
              </h3>
              <div className="flex bg-white/5 p-1 rounded-xl gap-1 border border-white/5">
                {['personal', 'company', 'others'].map(tab => {
                  const labels = {personal: 'أفراد', company: 'شركات', others: 'أخرى'};
                  return (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${
                        activeTab === tab 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-white/5 flex-1">
              {filteredRequests.map((req) => {
                const conf = typeConfig(req.userType);
                return (
                  <div
                    key={req._id}
                    onClick={() => setSelectedReq(req)}
                    className={`p-4 cursor-pointer transition-all duration-300 text-right border-r-4 ${
                      selectedReq?._id === req._id 
                        ? 'bg-gradient-to-l from-primary/15 via-primary/5 to-transparent border-primary shadow-[inset_-4px_0_15px_rgba(45,70,255,0.08)]' 
                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400 font-mono" dir="ltr">{req.userId}</span>
                      <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold ${conf.color}`}>
                        {conf.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      {req.firstName} {req.middleName} {req.lastName}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">{req.email}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* تفاصيل الطلب المختار (Detail View) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedReq ? (
              <div className="glass p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-start border-b border-white/10 pb-6">
                  <div className="flex items-center gap-5">
                    {/* الصورة الشخصية أو شعار المنشأة */}
                    {selectedReq.personalPhotoPath || selectedReq.logoPhotoPath ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <img 
                          src={`http://2.24.108.101:5000${selectedReq.personalPhotoPath || selectedReq.logoPhotoPath}`} 
                          alt="Avatar" 
                          className={`relative w-16 h-16 object-cover border-2 border-white/20 shadow-xl ${
                            selectedReq.userType === 'personal' ? 'rounded-full' : 'rounded-xl'
                          }`}
                        />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 flex items-center justify-center font-bold text-2xl border-2 border-white/20 shadow-xl ${
                        selectedReq.userType === 'personal' 
                          ? 'rounded-full bg-primary/20 text-primary' 
                          : 'rounded-xl bg-amber-500/20 text-amber-400'
                      }`}>
                        {selectedReq.firstName[0]}
                      </div>
                    )}
                    <div className="text-right">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedReq.firstName} {selectedReq.middleName} {selectedReq.lastName}
                      </h2>
                      <p className="text-sm text-gray-400 font-mono" dir="ltr">{selectedReq.email}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full border text-xs font-bold shadow-lg ${typeConfig(selectedReq.userType).color}`}>
                    {typeConfig(selectedReq.userType).label}
                  </span>
                </div>

                {/* تفاصيل البيانات (Premium Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(45,70,255,0.1)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                      <User size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">معرف العميل (User ID)</p>
                      <p className="text-sm font-bold text-white font-mono" dir="ltr">{selectedReq.userId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                      <FileText size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">رقم الحساب البنكي</p>
                      <p className="text-sm font-bold text-white font-mono" dir="ltr">{selectedReq.accountNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                      <Calendar size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">تاريخ الميلاد / التأسيس</p>
                      <p className="text-sm font-bold text-white">
                        {new Date(selectedReq.dateOfBirth).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <Phone size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">رقم الهاتف</p>
                      <p className="text-sm font-bold text-white font-mono" dir="ltr">{selectedReq.phone || 'غير مسجل'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all">
                      <ShieldAlert size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">معرف الجهاز (Device ID)</p>
                      <p className="text-sm font-bold text-white font-mono" dir="ltr">{selectedReq.deviceId}</p>
                    </div>
                  </div>

                  {/* الحقول الإضافية للشركات والمنشآت */}
                  {selectedReq.userType !== 'personal' && (
                    <>
                      <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                          <Users size={18} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">اسم المسؤول</p>
                          <p className="text-sm font-bold text-white">{selectedReq.managerName || 'غير مسجل'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                          <Briefcase size={18} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">رقم السجل / الترخيص</p>
                          <p className="text-sm font-bold text-white font-mono">{selectedReq.commercialReg || 'غير مسجل'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-gradient-to-br from-white/5 to-transparent p-4 rounded-2xl border border-white/10 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all group md:col-span-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                          <MapPin size={18} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">العنوان الجغرافي للنشاط</p>
                          <p className="text-sm font-bold text-white">{selectedReq.address || 'غير مسجل'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* قسم بيانات الأمان وكلمات المرور */}
                <div className="relative mt-8 p-6 rounded-3xl overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                  <div className="absolute inset-0 bg-[#050B14] opacity-80"></div>
                  {/* Subtle Grid Pattern SVG */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                  
                  <div className="relative z-10 text-right space-y-5">
                    <h4 className="text-sm font-bold text-white flex items-center justify-end gap-2">
                      <ShieldCheck size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      منطقة الأمان والتشفير (Security Data)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Login Password */}
                      <div className="bg-rose-950/30 p-5 rounded-2xl border border-rose-500/20 group hover:border-rose-500/50 hover:bg-rose-950/50 transition-all relative overflow-hidden shadow-[inset_0_0_20px_rgba(244,63,94,0.02)]">
                        <div className="flex justify-between items-start mb-4">
                          <Lock size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-md border border-rose-500/30 font-bold uppercase tracking-wider">Login</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">كلمة مرور الدخول</p>
                        <p className="text-[11px] font-mono text-rose-200 break-all leading-tight opacity-50 group-hover:opacity-100 transition-opacity">
                          {selectedReq.loginPasswordHash || 'غير متوفر'}
                        </p>
                      </div>

                      {/* Transaction Password */}
                      <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-500/20 group hover:border-amber-500/50 hover:bg-amber-950/50 transition-all relative overflow-hidden shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]">
                        <div className="flex justify-between items-start mb-4">
                          <Key size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 font-bold uppercase tracking-wider">Txn Pass</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">كلمة مرور العمليات</p>
                        <p className="text-[11px] font-mono text-amber-200 break-all leading-tight opacity-50 group-hover:opacity-100 transition-opacity">
                          {selectedReq.passwordHash || 'غير متوفر'}
                        </p>
                      </div>

                      {/* PIN */}
                      <div className="bg-blue-950/30 p-5 rounded-2xl border border-blue-500/20 group hover:border-blue-500/50 hover:bg-blue-950/50 transition-all relative overflow-hidden shadow-[inset_0_0_20px_rgba(59,130,246,0.02)]">
                        <div className="flex justify-between items-start mb-4">
                          <Fingerprint size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/30 font-bold uppercase tracking-wider">Secure PIN</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">الرمز السري</p>
                        <p className="text-[11px] font-mono text-blue-200 break-all leading-tight opacity-50 group-hover:opacity-100 transition-opacity">
                          {selectedReq.pinHash || 'غير متوفر'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* قسم الوثائق والمستندات */}
                <div className="space-y-8 border-t border-white/10 pt-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  
                  {/* (تم حذف وثيقة إثبات الشخصية المحاكاة بناءً على طلبك) */}

                  {/* معرض الوثائق المرفوعة الفعلية */}
                  <div className="space-y-5 text-right">
                    <h4 className="text-sm font-bold text-white border-b border-white/10 pb-3">المستندات والصور المرفوعة من التطبيق</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      
                      {/* الصورة الشخصية */}
                      {selectedReq.personalPhotoPath && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 hover:bg-white/10 transition-all">
                          <p className="text-xs text-emerald-400 font-bold z-10 relative">الصورة الشخصية (Selfie)</p>
                          <div 
                            onClick={() => {
                              setZoomedImg(`http://2.24.108.101:5000${selectedReq.personalPhotoPath}`);
                              setIsZoomed(true);
                            }}
                            className="bg-black/40 rounded-xl flex justify-center items-center h-36 border border-white/10 overflow-hidden cursor-zoom-in relative z-10 shadow-inner"
                          >
                            <img 
                              src={`http://2.24.108.101:5000${selectedReq.personalPhotoPath}`} 
                              alt="Selfie" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <ZoomIn size={28} className="text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* صورة الهوية */}
                      {selectedReq.idImagePath && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden group hover:border-blue-500/40 hover:bg-white/10 transition-all">
                          <p className="text-xs text-blue-400 font-bold z-10 relative">إثبات الهوية / المستند</p>
                          <div 
                            onClick={() => {
                              setZoomedImg(`http://2.24.108.101:5000${selectedReq.idImagePath}`);
                              setIsZoomed(true);
                            }}
                            className="bg-black/40 rounded-xl flex justify-center items-center h-36 border border-white/10 overflow-hidden cursor-zoom-in relative z-10 shadow-inner"
                          >
                            <img 
                              src={`http://2.24.108.101:5000${selectedReq.idImagePath}`} 
                              alt="ID Document" 
                              className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <ZoomIn size={28} className="text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* التوقيع */}
                      {selectedReq.signaturePhotoPath && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden group hover:border-amber-500/40 hover:bg-white/10 transition-all">
                          <p className="text-xs text-amber-400 font-bold z-10 relative">نموذج التوقيع الحي</p>
                          <div 
                            onClick={() => {
                              setZoomedImg(`http://2.24.108.101:5000${selectedReq.signaturePhotoPath}`);
                              setIsZoomed(true);
                            }}
                            className="bg-white rounded-xl flex justify-center items-center h-36 border border-white/10 overflow-hidden cursor-zoom-in relative z-10 p-2 shadow-inner"
                          >
                            <img 
                              src={`http://2.24.108.101:5000${selectedReq.signaturePhotoPath}`} 
                              alt="Signature" 
                              className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <ZoomIn size={28} className="text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* الشعار */}
                      {selectedReq.logoPhotoPath && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden group hover:border-purple-500/40 hover:bg-white/10 transition-all">
                          <p className="text-xs text-purple-400 font-bold z-10 relative">شعار المنشأة / اللوجو</p>
                          <div 
                            onClick={() => {
                              setZoomedImg(`http://2.24.108.101:5000${selectedReq.logoPhotoPath}`);
                              setIsZoomed(true);
                            }}
                            className="bg-black/40 rounded-xl flex justify-center items-center h-36 border border-white/10 overflow-hidden cursor-zoom-in relative z-10 shadow-inner"
                          >
                            <img 
                              src={`http://2.24.108.101:5000${selectedReq.logoPhotoPath}`} 
                              alt="Logo" 
                              className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <ZoomIn size={28} className="text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex gap-5 border-t border-white/10 pt-8">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedReq._id)}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                    قبول وتفعيل الحساب
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedReq._id)}
                    className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <XCircle size={18}/>}
                    رفض طلب التسجيل
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass p-12 rounded-2xl border border-white/5 text-center text-gray-500">
                يرجى اختيار طلب من القائمة الجانبية لعرض تفاصيل المراجعة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Modal Overlay */}
      {isZoomed && (selectedReq || zoomedImg) && (
        <div 
          onClick={() => {
            setIsZoomed(false);
            setZoomedImg(null);
          }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl relative animate-scale-up flex flex-col items-center"
          >
            <button 
              onClick={() => {
                setIsZoomed(false);
                setZoomedImg(null);
              }}
              className="absolute -top-12 left-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <div className="shadow-2xl max-h-[80vh] flex items-center justify-center w-full">
              {zoomedImg ? (
                <img 
                  src={zoomedImg} 
                  alt="Zoomed View" 
                  className="max-h-[80vh] max-w-full object-contain rounded-lg border border-white/10" 
                />
              ) : (
                <DocumentCard req={selectedReq} isZoomedView={true} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
