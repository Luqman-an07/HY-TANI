import React, { useState } from 'react';
import { CheckCircle, Calendar, ArrowRight, X, Sprout } from 'lucide-react';

const CheckInModal = ({ isOpen, onClose, farm, onConfirm }) => {
  if (!isOpen || !farm) return null;

  const [processing, setProcessing] = useState(false);

  // Hitung prediksi tanggal berikutnya (Hanya visualisasi untuk user)
  const getNextDatePreview = () => {
    const today = new Date();
    let days = 14;
    if (farm.status === 'bahaya') days = 3;
    if (farm.status === 'waspada') days = 7;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + days);
    return { date: nextDate.toLocaleDateString('id-ID'), days };
  };

  const { date, days } = getNextDatePreview();

  const handleConfirm = async () => {
    setProcessing(true);
    await onConfirm(farm.id); // Panggil fungsi proses di parent
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Decorative Header */}
        <div className="bg-emerald-600 h-24 relative overflow-hidden flex justify-center items-center">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px'}}></div>
            <div className="bg-white p-3 rounded-full shadow-lg z-10">
                <Sprout className="w-8 h-8 text-emerald-600" />
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-emerald-100 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800">Konfirmasi Kunjungan</h3>
            <p className="text-sm text-slate-500 mt-1">Anda berada di lokasi lahan:</p>
            
            <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-bold text-lg text-emerald-800">{farm.name}</p>
                <p className="text-xs text-slate-500 font-medium">Milik: {farm.farmer}</p>
                <div className={`mt-2 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${farm.status === 'bahaya' ? 'bg-red-50 text-red-600 border-red-200' : farm.status === 'waspada' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    Status: {farm.status}
                </div>
            </div>

            {/* Visualisasi Jadwal Otomatis */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
                <div className="text-center">
                    <span className="block font-bold text-slate-700">Hari Ini</span>
                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                </div>
                <ArrowRight size={16} className="text-blue-400"/>
                <div className="text-center">
                    <span className="block font-bold text-blue-700">Jadwal Baru</span>
                    <span className="text-blue-600">{date} (+{days} hari)</span>
                </div>
            </div>

            <button 
                onClick={handleConfirm}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
                {processing ? (
                    <span>Memproses...</span>
                ) : (
                    <>
                        <CheckCircle size={18} />
                        <span>Check-In Sekarang</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;