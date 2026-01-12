import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Phone, TrendingUp, 
  Clock, CheckCircle, History, AlertTriangle, Sprout, 
  Leaf, MoreHorizontal, Lightbulb, MessageCircle, 
  Edit, Trash2, Download
} from 'lucide-react';

// Helper Format Tanggal Indonesia
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  return dateStr;
};

const FarmerDetailFull = ({ farm, onBack, onCompleteVisit, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false); 

  if (!farm) return null;

  const contactNumber = farm.contact || farm.phone || '-';
  const historyLog = farm.visitHistory || [];

  // --- LOGIKA PROGRESS BAR TANAMAN ---
  // Default jika tanggal tidak ada: Anggap baru tanam hari ini (Progress 0%)
  const plantingDate = farm.plantingDate ? new Date(farm.plantingDate) : new Date();
  
  // Jika harvestDate tidak ada, estimasi +105 hari dari plantingDate
  const harvestDate = farm.harvestDate 
    ? new Date(farm.harvestDate) 
    : new Date(new Date(plantingDate).setDate(plantingDate.getDate() + 105));
    
  const today = new Date();

  // Hitung selisih hari
  const totalDuration = Math.max(1, (harvestDate - plantingDate) / (1000 * 60 * 60 * 24));
  const elapsed = Math.max(0, (today - plantingDate) / (1000 * 60 * 60 * 24));
  
  // Persentase Progress (Max 100%)
  let progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
  
  // Tentukan Fase Tanam
  let cropPhase = "Vegetatif Awal";
  if (progressPercent > 30) cropPhase = "Vegetatif Maksimal";
  if (progressPercent > 60) cropPhase = "Generatif (Bunting)";
  if (progressPercent > 90) cropPhase = "Pematangan";
  if (progressPercent >= 100) cropPhase = "SIAP PANEN";

  // --- LOGIKA REKOMENDASI ---
  const getRecommendations = (status) => {
    switch(status) {
      case 'sehat':
        return {
          bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600',
          title: 'Kondisi Lahan Optimal',
          actions: ["Pertahankan debit air irigasi.", "Lakukan pemupukan NPK rutin.", "Monitoring visual hama."]
        };
      case 'waspada':
        return {
          bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600',
          title: 'Terdeteksi Stres Ringan',
          actions: ["Tingkatkan debit air irigasi.", "Tambahkan pupuk Urea dosis ringan.", "Cek manual tanda kuning daun."]
        };
      case 'bahaya':
        return {
          bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600',
          title: 'PERINGATAN KRITIS',
          actions: ["Lakukan isolasi blok segera.", "Penyemprotan pestisida dosis tinggi.", "Pangkas tanaman terinfeksi."]
        };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', actions: [] };
    }
  };

  const rec = getRecommendations(farm.status);

  // --- FITUR DOWNLOAD LAPORAN ---
  const handleDownloadReport = () => {
    const reportContent = `LAPORAN HASIL MONITORING HY-TANI\n--------------------------------\nID Lahan      : ${farm.id}\nNama Petani   : ${farm.farmer}\nLokasi        : ${farm.name}\nLuas Lahan    : ${farm.size}\nKontak        : ${contactNumber}\n\nSTATUS SAAT INI: ${farm.status.toUpperCase()}\n--------------------------------\nPrediksi Panen : ${farm.prediction}\nValuasi Ekonomi: ${farm.value}\nNilai NDVI     : ${farm.ndvi}\nFase Tanam     : ${cropPhase} (${Math.round(elapsed)} HST)\n\nRIWAYAT KUNJUNGAN:\n${historyLog.map(log => `- ${formatDate(log.completedDate)}: ${log.note}`).join('\n')}\n\nDicetak pada: ${new Date().toLocaleString('id-ID')}`;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_${farm.farmer.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMenu(false);
  };

  // --- FITUR WHATSAPP ---
  const handleWhatsApp = () => {
    if (contactNumber.length < 5 || contactNumber === '-') { alert("Nomor kontak tidak valid."); return; }
    let formattedPhone = contactNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);
    
    const message = `Halo Bapak/Ibu ${farm.farmer},\n\nBerikut update kondisi lahan *${farm.name}*:\nStatus: *${farm.status.toUpperCase()}*\nFase: ${cropPhase}\nPrediksi Panen: ${farm.prediction}\n\nRekomendasi HY-TANI:\n${rec.actions.map(a => `- ${a}`).join('\n')}\n\nMohon dicek. Terima kasih.`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300">
      
      {/* 1. HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center">
              {farm.farmer}
              <span className={`ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${farm.status === 'sehat' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : farm.status === 'waspada' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {farm.status}
              </span>
            </h1>
            <p className="text-xs text-slate-500 flex items-center mt-0.5">
              <MapPin size={12} className="mr-1"/> {farm.name} • ID: {farm.id}
            </p>
          </div>
        </div>
        
        <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className={`p-2 border rounded-lg transition-colors ${showMenu ? 'bg-slate-100' : 'border-slate-200'}`}>
                <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div> 
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => { onEdit(farm); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"><Edit size={16} className="mr-2"/> Edit Data Lahan</button>
                  <button onClick={handleDownloadReport} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors border-t border-slate-100"><Download size={16} className="mr-2"/> Unduh Laporan (TXT)</button>
                  <button onClick={() => { onDelete(farm); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors border-t border-slate-100"><Trash2 size={16} className="mr-2"/> Hapus Lahan</button>
                </div>
              </>
            )}
        </div>
      </div>

      {/* 2. CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

            {/* VISUAL PROGRESS BAR SIKLUS TANAM */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 flex items-center"><Sprout size={16} className="mr-2 text-emerald-600"/> Siklus Tanaman</h3>
                        <p className="text-xs text-slate-500 mt-1">Fase saat ini: <span className="font-bold text-emerald-600">{cropPhase}</span> ({Math.round(elapsed)} HST)</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Estimasi Panen</p>
                        <p className="text-sm font-bold text-slate-800">{formatDate(farm.harvestDate || harvestDate.toISOString())}</p>
                    </div>
                </div>
                
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    <div className="absolute top-0 bottom-0 left-[25%] w-px bg-white/50"></div>
                    <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white/50"></div>
                    <div className="absolute top-0 bottom-0 left-[75%] w-px bg-white/50"></div>
                </div>
                
                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                    <span>Tanam: {formatDate(farm.plantingDate || plantingDate.toISOString())}</span>
                    <span>50% (Bunting)</span>
                    <span>Panen</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* KOLOM KIRI (METRIK & REKOMENDASI) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Prediksi Panen</p><p className="text-lg font-bold text-emerald-600">{farm.prediction}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Luas Lahan</p><p className="text-lg font-bold text-slate-700">{farm.size} Ha</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Nilai NDVI</p><p className="text-lg font-bold text-blue-600 font-mono">{farm.ndvi}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Valuasi</p><p className="text-lg font-bold text-slate-700 truncate">{farm.value}</p></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><Leaf size={16} className="mr-2 text-emerald-500"/> Analisis & Rekomendasi</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Grid Visual */}
                            <div className="grid grid-cols-4 gap-2 w-full md:w-48 aspect-square shrink-0">
                                {(farm.plots || []).slice(0, 16).map((plot, idx) => (
                                    <div key={idx} className={`rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${plot.type === 'sehat' ? 'bg-emerald-500' : plot.type === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}>
                                    {plot.score}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className={`p-5 rounded-xl border ${rec.bg} ${rec.border}`}>
                                   <div className="flex items-center mb-3">
                                      <Lightbulb size={18} className={`${rec.icon} mr-2`} />
                                      <h4 className={`font-bold text-sm ${rec.text}`}>{rec.title}</h4>
                                   </div>
                                   <ul className="space-y-2 mb-4">{rec.actions.map((a, i) => <li key={i} className="flex items-start text-sm text-slate-700"><div className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2 bg-slate-400 shrink-0"></div>{a}</li>)}</ul>
                                   <button onClick={handleWhatsApp} className="flex items-center justify-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-600 hover:bg-slate-50 w-full"><MessageCircle size={14} className="text-green-500"/><span>Kirim Instruksi via WhatsApp</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN (JADWAL & KONTAK) */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={64} /></div>
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 relative z-10">Jadwal Kunjungan</p>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 relative z-10">{formatDate(farm.nextVisit)}</h2>
                        <button onClick={() => onCompleteVisit(farm)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center relative z-10"><CheckCircle size={18} className="mr-2"/> Selesaikan</button>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Kontak Pemilik</h3>
                        <div className="flex justify-between items-center">
                            <div><p className="font-bold text-slate-800">{farm.farmer}</p><p className="text-xs text-slate-500">{contactNumber}</p></div>
                            <button onClick={handleWhatsApp} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200"><Phone size={18}/></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIWAYAT KUNJUNGAN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6"><History size={20} className="mr-2 text-slate-400"/> Riwayat Kunjungan</h3>
                <div className="border-l-2 border-slate-100 ml-3 space-y-6 py-2">
                    {historyLog.length === 0 ? <p className="pl-6 text-sm text-slate-400 italic">Belum ada data.</p> : historyLog.map((log, idx) => (
                        <div key={idx} className="relative pl-6">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500"></div>
                            <p className="text-sm font-bold text-slate-800">{formatDate(log.completedDate)}</p>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mt-1">"{log.note}"</div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default FarmerDetailFull;