import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Phone, 
  CheckCircle, History, Sprout, 
  Leaf, MoreHorizontal, Lightbulb, MessageCircle, 
  Edit, Trash2, Download, Maximize, X, CloudSun, Wind, Droplets,
  Clock 
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// IMPORT GENERATOR PDF
import { generateFarmerReport } from '../lib/reportGenerator';

// Fix Icon Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper: Auto Zoom Peta
const FitBoundsToPolygon = ({ polygon }) => {
    const map = useMap();
    useEffect(() => {
        if (polygon && polygon.length > 0) {
            const bounds = L.latLngBounds(polygon);
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }, [polygon, map]);
    return null;
};

// Helper: Format Tanggal Saja
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return dateStr; }
};

// Helper: Format Tanggal & Jam
const formatDateTime = (timestamp) => {
    if (!timestamp) return "Data Manual";
    return new Date(timestamp * 1000).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + " WIB";
};

// PERBAIKAN: Tambahkan prop 'user' untuk data di laporan PDF
const FarmerDetailFull = ({ farm, user, onBack, onCompleteVisit, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false); 
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  if (!farm) return null;

  const contactNumber = farm.contact || farm.phone || '-';
  const historyLog = farm.visitHistory || [];
  
  const centerLat = parseFloat(farm.lat) || -6.2088;
  const centerLng = parseFloat(farm.lng) || 106.8456;
  
  const farmPolygon = farm.polygon && farm.polygon.length > 0 
    ? farm.polygon 
    : [
        [centerLat + 0.0005, centerLng - 0.0005],
        [centerLat + 0.0005, centerLng + 0.0005],
        [centerLat - 0.0005, centerLng + 0.0005],
        [centerLat - 0.0005, centerLng - 0.0005],
      ];

  // --- 1. LOGIKA SIKLUS TANAMAN ---
  const plantingDate = farm.plantingDate ? new Date(farm.plantingDate) : new Date();
  const harvestDate = farm.harvestDate ? new Date(farm.harvestDate) : new Date(new Date(plantingDate).getTime() + (110 * 24 * 60 * 60 * 1000));
  
  const today = new Date();
  const totalDays = Math.ceil((harvestDate - plantingDate) / (1000 * 60 * 60 * 24));
  const currentHST = Math.max(0, Math.ceil((today - plantingDate) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, totalDays - currentHST);
  const progressPercent = Math.min(100, (currentHST / totalDays) * 100);
  
  let cropPhase = "Persiapan / Pindah Tanam";
  let phaseColor = "text-slate-600";
  
  if (currentHST > 0 && currentHST <= 15) { cropPhase = "Fase Vegetatif Awal (Perakaran)"; phaseColor = "text-emerald-500"; }
  else if (currentHST > 15 && currentHST <= 35) { cropPhase = "Fase Vegetatif Aktif (Anakan)"; phaseColor = "text-emerald-600"; }
  else if (currentHST > 35 && currentHST <= 60) { cropPhase = "Fase Generatif (Bunting)"; phaseColor = "text-yellow-600"; }
  else if (currentHST > 60 && currentHST <= 85) { cropPhase = "Fase Pembungaan & Pengisian"; phaseColor = "text-amber-600"; }
  else if (currentHST > 85) { cropPhase = "Fase Pematangan (Siap Panen)"; phaseColor = "text-red-600"; }

  // --- 2. WARNA STATUS ---
  const getStatusColor = (status) => {
      switch(status) {
          case 'sehat': return { fill: '#10b981', border: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' };
          case 'waspada': return { fill: '#f59e0b', border: '#d97706', text: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' };
          case 'bahaya': return { fill: '#ef4444', border: '#b91c1c', text: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' };
          default: return { fill: '#64748b', border: '#475569', text: 'text-slate-600', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-800' };
      }
  };
  const statusColor = getStatusColor(farm.status);

  const getRecommendations = (status) => {
    switch(status) {
      case 'sehat': return { title: 'Pertahankan Kondisi', actions: ["Jaga ketinggian air irigasi macak-macak.", "Lanjutkan pemupukan berimbang sesuai jadwal.", "Amati populasi musuh alami hama."] };
      case 'waspada': return { title: 'Perlu Tindakan Preventif', actions: ["Cek apakah ada genangan air berlebih.", "Tambahkan pupuk daun untuk boost nutrisi.", "Inspeksi manual: cari tanda bercak daun."] };
      case 'bahaya': return { title: 'INTERVENSI SEGERA', actions: ["Isolasi area yang terkena.", "Aplikasi pestisida/fungisida dosis kuratif.", "Konsultasi foto tanaman ke ahli."] };
      default: return { title: 'Data Belum Cukup', actions: ["Lakukan kunjungan lapangan segera."] };
    }
  };
  const rec = getRecommendations(farm.status);

  const handleWhatsApp = () => {
    if (!contactNumber || contactNumber === '-') { alert("Nomor kontak tidak valid."); return; }
    let cleanNumber = contactNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.substring(1);
    const message = `*LAPORAN HY-TANI* 🌿\nKepada: ${farm.farmer}\n\nKondisi Lahan: *${farm.name}*\n----------------------------------\n📊 Status: *${farm.status.toUpperCase()}* (NDVI: ${farm.ndvi})\n🗓 Umur Tanaman: ${currentHST} Hari (HST)\n🌱 Fase: ${cropPhase}\n\n*REKOMENDASI TINDAKAN:*\n${rec.actions.map(a => `✅ ${a}`).join('\n')}\n\nMohon segera dicek. Terima kasih.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- HANDLER DOWNLOAD ---
  const handleDownloadReport = () => { 
      try {
          // Panggil fungsi generator dengan data farm dan user yang login
          const currentUser = user || { full_name: "Komunikator Lapangan" };
          generateFarmerReport(farm, currentUser);
      } catch (error) {
          console.error(error);
          alert("Gagal mengunduh laporan PDF.");
      }
      setShowMenu(false); 
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300 relative">
      
      {/* MODAL PETA FULLSCREEN */}
      {isMapFullscreen && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center p-4 bg-slate-900 text-white">
                  <div><h3 className="font-bold text-lg">{farm.name}</h3><p className="text-xs text-slate-400">Analisis Citra Satelit</p></div>
                  <button onClick={() => setIsMapFullscreen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
              </div>
              <div className="flex-1 w-full relative">
                  <MapContainer center={[centerLat, centerLng]} zoom={18} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                      <Polygon positions={farmPolygon} pathOptions={{ color: statusColor.border, fillColor: statusColor.fill, fillOpacity: 0.4, weight: 2 }} />
                      <Marker position={[centerLat, centerLng]}></Marker>
                      <FitBoundsToPolygon polygon={farmPolygon} />
                  </MapContainer>
                  <div className="absolute bottom-8 left-8 z-[1000] bg-white p-4 rounded-xl shadow-2xl">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Legenda Status</p>
                      <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-xs">Sehat (NDVI &gt; 0.7)</span></div>
                      <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-xs">Waspada (0.4 - 0.7)</span></div>
                      <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-xs">Bahaya (&lt; 0.4)</span></div>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center">{farm.farmer}
              <span className={`ml-3 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${statusColor.badge}`}>{farm.status}</span>
            </h1>
            <p className="text-xs text-slate-500 flex items-center mt-0.5"><MapPin size={12} className="mr-1"/> {farm.name} • {farm.size} Ha</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4 mr-4 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <CloudSun size={20} className="text-blue-500"/>
            <div>
                <p className="text-xs font-bold text-slate-700">Cerah Berawan</p>
                <div className="flex items-center text-[10px] text-slate-500 space-x-2">
                    <span>32°C</span><span className="flex items-center"><Wind size={10} className="mr-1"/> 12 km/h</span><span className="flex items-center"><Droplets size={10} className="mr-1"/> 60%</span>
                </div>
            </div>
        </div>
        
        <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className={`p-2 border rounded-lg transition-colors ${showMenu ? 'bg-slate-100' : 'border-slate-200'}`}><MoreHorizontal size={20} /></button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div> 
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => { onEdit(farm); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"><Edit size={16} className="mr-2"/> Edit Data Lahan</button>
                  <button onClick={handleDownloadReport} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors border-t border-slate-100"><Download size={16} className="mr-2"/> Unduh Laporan (PDF)</button>
                  <button onClick={() => { onDelete(farm); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors border-t border-slate-100"><Trash2 size={16} className="mr-2"/> Hapus Lahan</button>
                </div>
              </>
            )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

            {/* WIDGET SIKLUS TANAMAN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 flex items-center"><Sprout size={16} className="mr-2 text-emerald-600"/> Siklus Tanaman</h3>
                        <p className={`text-sm font-bold mt-1 ${phaseColor}`}>{cropPhase}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Umur Tanaman: <span className="font-mono text-slate-700 font-bold">{currentHST}</span> Hari Setelah Tanam (HST)</p>
                    </div>
                    <div className="mt-3 md:mt-0 text-left md:text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Estimasi Panen ({daysLeft} hari lagi)</p>
                        <p className="text-lg font-bold text-slate-800">{formatDate(farm.harvestDate || harvestDate.toISOString())}</p>
                    </div>
                </div>
                
                <div className="relative pt-2 pb-6">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="absolute top-0 bottom-0 left-[0%] w-px h-full"><div className="absolute top-6 left-0 -translate-x-1/2 text-[9px] font-bold text-slate-400">Tanam</div></div>
                    <div className="absolute top-0 bottom-0 left-[27%] w-px bg-slate-200 h-full"><div className="absolute top-6 left-0 -translate-x-1/2 text-[9px] text-slate-400">30 HST</div></div>
                    <div className="absolute top-0 bottom-0 left-[54%] w-px bg-slate-200 h-full"><div className="absolute top-6 left-0 -translate-x-1/2 text-[9px] text-slate-400">60 HST</div></div>
                    <div className="absolute top-0 bottom-0 left-[81%] w-px bg-slate-200 h-full"><div className="absolute top-6 left-0 -translate-x-1/2 text-[9px] text-slate-400">90 HST</div></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* KOLOM KIRI: ANALISIS SATELIT */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Prediksi Panen</p><p className="text-lg font-bold text-emerald-600">{farm.prediction}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Luas Lahan</p><p className="text-lg font-bold text-slate-700">{farm.size} Ha</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Nilai NDVI</p><p className="text-lg font-bold text-blue-600 font-mono">{farm.ndvi}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">Valuasi</p><p className="text-lg font-bold text-slate-700 truncate">{farm.value}</p></div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[500px] md:h-[400px]">
                        <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200 group">
                            <button onClick={() => setIsMapFullscreen(true)} className="absolute top-3 right-3 z-[400] bg-white text-slate-700 p-2 rounded-lg shadow-md hover:bg-slate-50 hover:text-emerald-600 transition-all opacity-80 group-hover:opacity-100" title="Perbesar Peta"><Maximize size={18}/></button>
                            <MapContainer center={[centerLat, centerLng]} zoom={15} scrollWheelZoom={true} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                                <Polygon positions={farmPolygon} pathOptions={{ color: statusColor.border, fillColor: statusColor.fill, fillOpacity: 0.5, weight: 2 }}>
                                    <Tooltip sticky direction="top" offset={[0, -10]}><div className="text-xs font-bold">{farm.name}</div><div className={`text-[10px] uppercase ${statusColor.text}`}>{farm.status}</div></Tooltip>
                                </Polygon>
                                <Marker position={[centerLat, centerLng]}></Marker>
                                <FitBoundsToPolygon polygon={farmPolygon} />
                            </MapContainer>
                            <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-200 text-xs font-medium text-slate-600">Visualisasi Bentuk & Kesehatan Lahan</div>
                        </div>

                        <div className="w-full md:w-1/2 p-6 flex flex-col h-1/2 md:h-full overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-bold text-slate-700 flex items-center"><Leaf size={16} className={`mr-2 ${statusColor.text}`}/> Analisis Satelit</h3>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Terakhir Update</span>
                                    <span className="text-xs font-mono font-bold text-slate-600 flex items-center bg-slate-100 px-2 py-1 rounded mt-1"><Clock size={10} className="mr-1.5"/> {formatDateTime(farm.satelliteDate)}</span>
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl border mb-4 ${statusColor.bg} border-opacity-60`}>
                                <div className="flex items-center mb-2"><Lightbulb size={18} className={`mr-2 ${statusColor.text}`} /><h4 className={`font-bold text-sm ${statusColor.text}`}>{rec.title}</h4></div>
                                <p className="text-xs text-slate-600 leading-relaxed mb-0">Citra satelit menunjukkan indeks kesehatan vegetasi <b>{farm.ndvi}</b>. Pola warna pada peta merepresentasikan sebaran klorofil tanaman.</p>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tindakan Prioritas:</h4>
                                <ul className="space-y-3">
                                    {rec.actions.map((a, i) => (<li key={i} className="flex items-start text-sm text-slate-700"><CheckCircle size={16} className="mt-0.5 mr-3 text-emerald-500 shrink-0"/><span className="leading-snug">{a}</span></li>))}
                                </ul>
                            </div>
                            <button onClick={handleWhatsApp} className="mt-6 flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 w-full"><MessageCircle size={18}/><span className="font-bold text-sm">Kirim Instruksi ke Petani</span></button>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: SIDEBAR INFO */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm text-center relative overflow-hidden group hover:border-blue-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Calendar size={64} /></div>
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 relative z-10">Jadwal Kunjungan</p>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 relative z-10 tracking-tight">{formatDate(farm.nextVisit)}</h2>
                        <button onClick={() => onCompleteVisit(farm)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center relative z-10 transition-transform active:scale-95"><CheckCircle size={18} className="mr-2"/> Selesaikan</button>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Kontak Pemilik</h3>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div><p className="font-bold text-slate-800 text-sm">{farm.farmer}</p><p className="text-xs text-slate-500 font-mono mt-0.5">{contactNumber}</p></div>
                            <button onClick={handleWhatsApp} className="p-2.5 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Phone size={18}/></button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center mb-6"><History size={18} className="mr-2 text-slate-400"/> Riwayat Kunjungan</h3>
                        <div className="relative border-l-2 border-slate-100 ml-2.5 space-y-8">
                            {historyLog.length === 0 ? (
                                <div className="pl-6 py-2 text-sm text-slate-400 italic">Belum ada catatan kunjungan.</div>
                            ) : historyLog.map((log, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-500 shadow-sm"></div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-800">{formatDate(log.completedDate || log.visited_at)}</span>
                                        {log.status_snapshot && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">{log.status_snapshot}</span>}
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed shadow-sm">{log.note || log.notes || 'Pengecekan rutin dan wawancara petani.'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default FarmerDetailFull;