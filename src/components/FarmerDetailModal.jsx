import React, { useState } from 'react';
import { 
  X, MapPin, Calendar, Sprout, Phone, TrendingUp, 
  Clock, Activity, UserCheck, Printer, Droplets, Bug, Leaf, Ruler, Wallet
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; 

// Helper Format Tanggal
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
  return dateStr;
};

const FarmerDetailModal = ({ isOpen, onClose, farm }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !farm) return null;

  const joinDate = farm.joinDate ? formatDate(farm.joinDate) : "Jan 2024";

  // --- FUNGSI GENERATE KARTU ---
  const generateAndDownloadCard = () => {
    setIsDownloading(true);
    try {
        const canvas = document.createElement('canvas');
        const width = 1000; 
        const height = 600;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#064e3b'; 
        ctx.fillRect(0, 0, width, height);

        // Decor
        ctx.fillStyle = '#10b981'; 
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.arc(width + 50, height + 50, 300, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#34d399'; 
        ctx.beginPath(); ctx.arc(-50, -50, 250, 0, 2 * Math.PI); ctx.fill();
        ctx.globalAlpha = 1.0; 

        // Text
        ctx.fillStyle = '#6ee7b7'; ctx.font = 'bold 24px Arial'; ctx.fillText('HYTANI DIGITAL PASS', 50, 60);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 60px Arial'; ctx.fillText(farm.farmer.toUpperCase(), 50, 150);
        ctx.fillStyle = '#a7f3d0'; ctx.font = '30px Arial'; ctx.fillText(`LOKASI: ${farm.name.toUpperCase()}`, 50, 200);

        // Line
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(50, 240); ctx.lineTo(600, 240); ctx.stroke();

        // Details
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 20px Arial'; ctx.fillText('ID PETANI', 50, 280);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Courier New'; ctx.fillText(farm.id.toString().substring(0, 12), 50, 320);
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 20px Arial'; ctx.fillText('STATUS', 50, 380);

        // Badge
        ctx.fillStyle = '#ffffff'; ctx.roundRect(50, 400, 120, 40, 10); ctx.fill();
        ctx.fillStyle = '#064e3b'; ctx.font = 'bold 20px Arial'; ctx.fillText('AKTIF', 75, 427);
        ctx.fillStyle = '#d1fae5'; ctx.font = '20px Arial'; ctx.fillText(`Sejak ${joinDate}`, 190, 427);

        // QR
        const qrCanvasOnScreen = document.getElementById('qr-canvas-visible');
        if (qrCanvasOnScreen) {
            ctx.fillStyle = '#ffffff'; ctx.fillRect(width - 320, 100, 270, 320); 
            ctx.drawImage(qrCanvasOnScreen, width - 295, 125, 220, 220);
            ctx.fillStyle = '#64748b'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; 
            ctx.fillText('SCAN UNTUK DATA', width - 185, 380);
            ctx.font = '16px Arial'; ctx.fillText('Validasi Petani & Lahan', width - 185, 405);
        }

        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `KartuTani_${farm.farmer.replace(/\s+/g, '_')}.png`;
        link.click();

    } catch (e) { console.error(e); alert("Gagal membuat kartu."); } 
    finally { setIsDownloading(false); }
  };

  return (
    // FIX Z-INDEX: z-[9999] agar di atas Sidebar & Header
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Container Utama */}
      <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* HEADER: Minimalis & Bersih */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {farm.farmer.charAt(0)}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">{farm.farmer}</h2>
                    <p className="text-xs text-slate-500 flex items-center">
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded text-[10px] font-bold mr-2">AKTIF</span>
                        ID: {farm.id.toString().substring(0, 12)}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20}/>
            </button>
        </div>

        {/* BODY: 2 Kolom (Sidebar & Main Content) */}
        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col md:flex-row h-full">
                
                {/* === SIDEBAR KIRI: IDENTITAS & QR (35%) === */}
                <div className="w-full md:w-[35%] bg-white p-6 border-r border-slate-200 flex flex-col gap-6">
                    
                    {/* Kartu Digital Pass */}
                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-bold tracking-widest opacity-80 border-b border-emerald-600 pb-1">DIGITAL PASS</span>
                            <Sprout size={16} className="text-emerald-400"/>
                        </div>

                        <div className="bg-white p-3 rounded-xl mb-4 w-fit mx-auto shadow-sm">
                            <QRCodeCanvas id="qr-canvas-visible" value={farm.id.toString()} size={120} level={"H"} />
                        </div>

                        <div className="text-center relative z-10">
                            <p className="text-xs font-mono text-emerald-300 mb-1">{farm.id.toString().substring(0, 12)}</p>
                            <p className="text-sm font-bold uppercase tracking-wide">{farm.farmer}</p>
                        </div>

                        {/* Tombol Cetak */}
                        <div className="mt-4 flex justify-center">
                            <button 
                                onClick={generateAndDownloadCard}
                                disabled={isDownloading}
                                className="flex items-center space-x-2 bg-white text-emerald-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-emerald-50 hover:scale-105 transition-all disabled:opacity-70 active:scale-95"
                            >
                                {isDownloading ? <span className="animate-pulse">Mencetak...</span> : <><Printer size={14}/> <span>Cetak Kartu</span></>}
                            </button>
                        </div>
                    </div>

                    {/* Detail Kontak Ringkas */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Kontak</h4>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <Phone size={18} className="text-emerald-600 mr-3"/>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">WhatsApp</p>
                                    <p className="text-sm font-bold text-slate-700">{farm.contact || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <MapPin size={18} className="text-blue-600 mr-3"/>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Lokasi Lahan</p>
                                    <p className="text-sm font-bold text-slate-700 truncate w-40">{farm.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <UserCheck size={18} className="text-purple-600 mr-3"/>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Bergabung</p>
                                    <p className="text-sm font-bold text-slate-700">{joinDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === KONTEN KANAN: DATA & ANALISIS (65%) === */}
                <div className="w-full md:w-[65%] p-6 space-y-6">
                    
                    {/* 1. Header Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Luas Lahan</span>
                                <Ruler size={16} className="text-emerald-500"/>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{farm.size} <span className="text-sm text-slate-400 font-normal">Ha</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Prediksi Panen</span>
                                <TrendingUp size={16} className="text-blue-500"/>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{farm.prediction}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2 md:col-span-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Nilai</span>
                                <Wallet size={16} className="text-amber-500"/>
                            </div>
                            <p className="text-xl font-bold text-slate-800 truncate">{farm.value}</p>
                        </div>
                    </div>

                    {/* 2. Status Kesehatan */}
                    <div className={`p-4 rounded-xl border flex items-start space-x-4 ${farm.status === 'sehat' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`p-2 rounded-full ${farm.status === 'sehat' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <Activity size={20}/>
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-bold uppercase mb-1 ${farm.status === 'sehat' ? 'text-emerald-800' : 'text-red-800'}`}>
                                Kondisi Lahan: {farm.status}
                            </h4>
                            <p className="text-xs opacity-80 leading-relaxed">
                                {farm.status === 'sehat' 
                                    ? "Analisis satelit menunjukkan vegetasi dalam kondisi prima. Kadar klorofil optimal." 
                                    : "Terdeteksi anomali pada indeks vegetasi. Disarankan inspeksi lapangan segera."}
                            </p>
                        </div>
                    </div>

                    {/* 3. Parameter Fisik */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                            <Leaf size={14} className="mr-2"/> Kondisi Fisik Terakhir
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                <Droplets size={20} className="text-blue-500 mx-auto mb-2"/>
                                <p className="text-[10px] font-bold text-blue-400 uppercase">Air</p>
                                <p className="text-sm font-bold text-blue-700">{farm.waterScore > 70 ? 'Cukup' : 'Kurang'}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                                <Sprout size={20} className="text-emerald-500 mx-auto mb-2"/>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase">Pupuk</p>
                                <p className="text-sm font-bold text-emerald-700">{farm.fertScore > 70 ? 'Optimal' : 'Perlu'}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                                <Bug size={20} className="text-red-500 mx-auto mb-2"/>
                                <p className="text-[10px] font-bold text-red-400 uppercase">Hama</p>
                                <p className="text-sm font-bold text-red-700">{farm.pestScore > 80 ? 'Nihil' : 'Waspada'}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Jadwal Visit */}
                    <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Clock size={20} className="text-amber-400"/>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-60">Jadwal Kunjungan Berikutnya</p>
                                <p className="text-lg font-bold">{formatDate(farm.nextVisit)}</p>
                            </div>
                        </div>
                        <button className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                            Ubah
                        </button>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default FarmerDetailModal;