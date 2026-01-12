import React from 'react';
import { X, MapPin, Calendar, Sprout, Phone, QrCode, TrendingUp, Clock, Activity, UserCheck } from 'lucide-react';

// Fungsi Helper Format Tanggal
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  return dateStr;
};

const FarmerDetailModal = ({ isOpen, onClose, farm }) => {
  if (!isOpen || !farm) return null;

  // Simulasi Tanggal Bergabung (Jika data belum ada di database)
  // Mengambil tahun saat ini atau data real jika ada
  const joinDate = farm.joinDate ? formatDate(farm.joinDate) : "Januari 2024";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header Visual: Style Kartu Identitas */}
        <div className="bg-emerald-900 p-6 text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px'}}></div>
          
          <div className="z-10 flex items-center space-x-5">
            <div className="w-20 h-20 bg-emerald-700 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-emerald-800 shadow-xl shrink-0 uppercase">
              {farm.farmer.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{farm.farmer}</h2>
              <p className="text-emerald-300 text-sm flex items-center mt-1">
                <MapPin size={14} className="mr-1"/> {farm.name}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-mono border border-white/20">
                  ID: {farm.id.toString().padStart(6, '0')}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/80 rounded text-[10px] font-bold uppercase">
                  Binaan Aktif
                </span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Konten Utama */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KOLOM KIRI (2/3): INFORMASI DATA & ANALISIS */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Data Lahan Grid */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-wider">Spesifikasi Lahan & Petani</h3>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                   
                   {/* Luas Area */}
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase mb-0.5">Luas Area</p>
                     <p className="font-bold text-slate-800 flex items-center"><Sprout size={16} className="text-emerald-600 mr-2"/> {farm.size}</p>
                   </div>

                   {/* Usia Petani */}
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase mb-0.5">Usia Petani</p>
                     <p className="font-bold text-slate-800 flex items-center">
                        <Calendar size={16} className="text-blue-600 mr-2"/> {farm.age ? `${farm.age} Tahun` : '-'}
                     </p>
                   </div>

                   {/* Kontak */}
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase mb-0.5">Kontak / HP</p>
                     <p className="font-bold text-slate-800 flex items-center">
                        <Phone size={16} className="text-slate-600 mr-2"/> {farm.contact || '-'}
                     </p>
                   </div>

                   {/* FIELD BARU: BERGABUNG SEJAK */}
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase mb-0.5">Bergabung Sejak</p>
                     <p className="font-bold text-slate-800 flex items-center">
                        <UserCheck size={16} className="text-purple-600 mr-2"/> {joinDate}
                     </p>
                   </div>

                 </div>
              </div>

              {/* Real-time Analysis Box */}
              <div className={`p-5 rounded-2xl border flex items-center space-x-4 relative overflow-hidden ${farm.status === 'sehat' ? 'bg-emerald-50 border-emerald-100' : farm.status === 'waspada' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                   {/* Background Decor */}
                   <Activity className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-10 ${farm.status === 'sehat' ? 'text-emerald-600' : 'text-red-600'}`} />
                   
                   <div className={`p-3 rounded-full shrink-0 ${farm.status === 'sehat' ? 'bg-emerald-100 text-emerald-600' : farm.status === 'waspada' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                     <TrendingUp size={24} />
                   </div>
                   <div>
                     <p className="text-xs font-bold opacity-60 uppercase tracking-wide">Analisis Satelit (Live)</p>
                     <p className="text-lg font-bold text-slate-800 mt-1">Prediksi: {farm.prediction}</p>
                     <p className="text-sm font-medium opacity-80">Valuasi Ekonomi: {farm.value}</p>
                   </div>
              </div>
            </div>

            {/* KOLOM KANAN (1/3): QR & JADWAL */}
            <div className="space-y-6 flex flex-col">
              
              {/* QR Code Card */}
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm flex-1">
                <QrCode size={90} className="text-slate-800 mb-4" />
                <p className="text-[10px] text-slate-400 font-mono tracking-widest">DIGITAL PASS</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{farm.farmer}</p>
              </div>

              {/* Status Kunjungan */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start">
                    <Clock size={16} className="text-blue-600 mr-2 mt-0.5 shrink-0"/>
                    <div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Jadwal Visit</p>
                        <p className="text-sm font-bold text-blue-900">{formatDate(farm.nextVisit)}</p>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-400">
            Data tersinkronisasi local. Terakhir update: <span className="font-mono text-slate-600">{farm.lastUpdate}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FarmerDetailModal;