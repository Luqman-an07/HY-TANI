import React, { useState } from 'react';
import { X, CheckCircle, Calendar, FileText, ArrowRight, Save } from 'lucide-react';

const CompleteVisitModal = ({ isOpen, onClose, onSave, farmName }) => {
  const [note, setNote] = useState('');
  const [nextDateMode, setNextDateMode] = useState('auto'); // auto (+7 days) or manual
  const [manualDate, setManualDate] = useState('');

  if (!isOpen) return null;

  // Helper untuk hitung 7 hari ke depan
  const getNextWeekDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Tentukan tanggal berikutnya
    let nextVisitDate = "";
    if (nextDateMode === 'auto') {
      nextVisitDate = getNextWeekDate();
    } else {
      if (!manualDate) return alert("Pilih tanggal kunjungan berikutnya!");
      const d = new Date(manualDate);
      nextVisitDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    }

    // Kirim data: Catatan hari ini & Tanggal visit berikutnya
    onSave({
      note: note || "Kunjungan rutin. Kondisi lahan stabil.",
      completedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      nextVisit: nextVisitDate
    });

    // Reset form
    setNote('');
    setNextDateMode('auto');
    setManualDate('');
  };

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" /> Selesaikan Kunjungan
            </h3>
            <p className="text-xs text-slate-500">Lahan: {farmName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 1. Laporan Hasil Kunjungan */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Catatan Lapangan Hari Ini</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <textarea 
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                placeholder="Contoh: Hama wereng sudah berkurang, irigasi lancar..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* 2. Jadwalkan Ulang */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center">
              <ArrowRight size={12} className="mr-1"/> Jadwalkan Kunjungan Berikutnya
            </h4>
            
            <div className="flex space-x-2 mb-3">
              <button 
                type="button"
                onClick={() => setNextDateMode('auto')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${nextDateMode === 'auto' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                +7 Hari (Rutin)
              </button>
              <button 
                type="button"
                onClick={() => setNextDateMode('manual')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${nextDateMode === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                Pilih Tanggal
              </button>
            </div>

            {nextDateMode === 'auto' ? (
              <p className="text-xs text-blue-600 bg-white p-2 rounded border border-blue-200 text-center">
                Jadwal berikutnya: <span className="font-bold">{getNextWeekDate()}</span>
              </p>
            ) : (
              <input 
                type="date" 
                required
                min={todayISO}
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
            )}
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-transform active:scale-95 flex items-center justify-center">
            <Save size={18} className="mr-2" /> Simpan & Perbarui Jadwal
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteVisitModal;