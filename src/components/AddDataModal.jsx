import React, { useState, useEffect } from 'react';
import { X, Save, Sprout, Droplets, Bug, Leaf, Calendar, Clock, AlertTriangle, AlertCircle, Phone, User, MapPin, Ruler, Timer, UserCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- KOMPONEN: PICKER LOKASI ---
const LocationPicker = ({ position, onLocationSelect, center }) => {
    const map = useMap();
    
    // Efek untuk memindahkan kamera peta saat modal dibuka
    useEffect(() => {
        if (position) {
            map.flyTo(position, 16); // Fokus ke pin yang sudah ada (Edit Mode)
        } else if (center) {
            map.flyTo(center, 15); // Fokus ke desa komunikator (New Mode)
        }
    }, [position, center, map]);

    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });

    return position ? <Marker position={position} /> : null;
};

// Tambahkan prop 'userLocation'
const AddDataModal = ({ isOpen, onClose, onSave, initialData, userLocation }) => {
  const [formData, setFormData] = useState({
    farmer: '', contact: '', joinDate: '', name: '', size: '', age: '',
    plantingDate: '', harvestDate: '', nextVisit: '',
    lat: null, lng: null
  });

  const [scheduleType, setScheduleType] = useState('auto'); 
  const [autoScheduleReason, setAutoScheduleReason] = useState('');
  const [parameters, setParameters] = useState({ water: '', fertilizer: '', pest: '' });
  const [calculation, setCalculation] = useState({ status: 'bahaya', score: 0, ndvi: 0, prediction: '0 Ton', value: 'Rp 0', failureRisk: 100 });

  // --- LOGIKA TITIK TENGAH PETA (DINAMIS) ---
  // 1. Jika User punya lokasi desa -> Gunakan itu
  // 2. Jika tidak -> Default Indonesia
  const mapCenter = userLocation?.lat 
    ? [userLocation.lat, userLocation.lng] 
    : [-2.5489, 118.0149]; 

  useEffect(() => {
    if (initialData) {
      setFormData({
        farmer: initialData.farmer,
        contact: initialData.contact || '',
        joinDate: initialData.joinDate || '',
        name: initialData.name,
        size: initialData.size,
        age: initialData.age || '',
        plantingDate: initialData.plantingDate || '',
        harvestDate: initialData.harvestDate || '',
        nextVisit: initialData.nextVisit || '',
        lat: initialData.lat || null,
        lng: initialData.lng || null
      });
      setParameters({
        water: initialData.waterScore || '',
        fertilizer: initialData.fertScore || '',
        pest: initialData.pestScore || ''
      });
      setScheduleType('manual');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const handlePlantingDateChange = (e) => {
    const pDateVal = e.target.value;
    if (pDateVal) {
        const pDate = new Date(pDateVal);
        const hDate = new Date(pDate);
        hDate.setDate(pDate.getDate() + 105); 
        const hDateString = hDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, plantingDate: pDateVal, harvestDate: hDateString }));
    } else {
        setFormData(prev => ({ ...prev, plantingDate: pDateVal }));
    }
  };

  useEffect(() => {
    if (scheduleType === 'auto') {
      const date = new Date();
      let daysToAdd = 7;
      let reason = "";
      if (calculation.score === 0 || parameters.water === '') {
         daysToAdd = 1; reason = "Data belum lengkap: Harap lengkapi parameter.";
      } else if (calculation.status === 'sehat') {
        daysToAdd = 7; reason = "Status Sehat: Monitoring rutin mingguan.";
      } else {
        daysToAdd = 3; reason = `Status ${calculation.status.toUpperCase()}: Perlu tindakan segera!`;
      }
      date.setDate(date.getDate() + daysToAdd); 
      const dateString = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, nextVisit: dateString }));
      setAutoScheduleReason(reason);
    }
  }, [scheduleType, calculation.status, calculation.score, parameters]); 

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ 
        farmer: '', contact: '', joinDate: today, name: '', size: '', age: '', 
        plantingDate: '', harvestDate: '', nextVisit: '', lat: null, lng: null
    });
    setParameters({ water: '', fertilizer: '', pest: '' });
    setScheduleType('auto'); 
  };

  useEffect(() => {
    const waterScore = parameters.water === '' ? 0 : parseInt(parameters.water);
    const fertScore = parameters.fertilizer === '' ? 0 : parseInt(parameters.fertilizer);
    const pestScore = parameters.pest === '' ? 0 : parseInt(parameters.pest);
    const finalScore = (waterScore * 0.4) + (fertScore * 0.3) + (pestScore * 0.3);
    let status = 'sehat';
    if (finalScore < 50) status = 'bahaya';
    else if (finalScore < 80) status = 'waspada';
    const landSize = parseFloat(formData.size.replace(',', '.') || 0);
    const maxYieldPerHa = 6; 
    const estimatedYield = landSize * maxYieldPerHa * (finalScore / 100);
    const pricePerTon = 6000000;
    const estimatedValue = (estimatedYield * pricePerTon) / 1000000; 
    const simulatedNDVI = (0.1 + (finalScore / 100) * 0.75).toFixed(2);
    const risk = (100 - finalScore).toFixed(0);
    setCalculation({ status, score: finalScore.toFixed(0), ndvi: simulatedNDVI, prediction: `${estimatedYield.toFixed(1)} Ton`, value: `Rp ${estimatedValue.toFixed(1)} Juta`, failureRisk: risk });
  }, [parameters, formData.size]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parameters.water === '' || parameters.fertilizer === '' || parameters.pest === '') {
        alert("Mohon lengkapi semua Parameter Lapangan!"); return;
    }
    if (!formData.lat || !formData.lng) {
        alert("Mohon tandai lokasi lahan pada peta!"); return;
    }
    onSave({ ...formData, ...initialData, ...calculation, waterScore: parameters.water, pestScore: parameters.pest, fertScore: parameters.fertilizer });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Data & Kalibrasi' : 'Asesmen Lahan Baru'}</h2>
            <p className="text-xs text-slate-500">Isi data pribadi, tandai lokasi, dan parameter fisik.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto p-6 scroll-smooth">
          <form id="addFarmForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><User size={16} className="mr-2 text-blue-600"/> Data Pribadi Petani</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                        <input required type="text" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500" placeholder="Contoh: Pak Budi Santoso" value={formData.farmer} onChange={e => setFormData({...formData, farmer: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Usia Petani (Thn)</label>
                        <input required type="number" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500" placeholder="45" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center"><Phone size={10} className="mr-1"/> Kontak / WA</label>
                        <input required type="tel" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500" placeholder="0812..." value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><MapPin size={16} className="mr-2 text-emerald-600"/> Lokasi & Siklus Tanam</h3>
                
                {/* --- PETA OTOMATIS BERPUSAT DI DESA --- */}
                <div className="mb-4">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tandai Lokasi Lahan (Klik pada Peta)</label>
                    <div className="h-48 w-full rounded-xl overflow-hidden border-2 border-white shadow-sm relative z-0">
                        <MapContainer 
                            center={mapCenter} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} />
                            <LocationPicker 
                                position={formData.lat ? [formData.lat, formData.lng] : null}
                                center={mapCenter} // Kirim center dinamis ke picker
                                onLocationSelect={(latlng) => setFormData({...formData, lat: latlng.lat, lng: latlng.lng})}
                            />
                        </MapContainer>
                        
                        {!formData.lat && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-[400]">
                                <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm animate-bounce">
                                    👇 Klik peta untuk tandai lahan di {userLocation?.villageName || 'wilayah ini'}
                                </span>
                            </div>
                        )}
                    </div>
                    {formData.lat && (
                        <p className="text-[10px] text-emerald-600 mt-1 font-mono flex items-center">
                            <MapPin size={10} className="mr-1"/> Koordinat: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nama Blok / Lokasi</label>
                        <input required type="text" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500" placeholder="Blok Utara" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center"><Ruler size={10} className="mr-1"/> Luas (Hektar)</label>
                        <input required type="number" step="0.1" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500" placeholder="1.5" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center"><Sprout size={10} className="mr-1"/> Tanggal Tanam</label>
                        <input required type="date" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 text-slate-700" value={formData.plantingDate} onChange={handlePlantingDateChange} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center"><Timer size={10} className="mr-1"/> Estimasi Panen</label>
                        <input required type="date" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 text-slate-700" value={formData.harvestDate} onChange={e => setFormData({...formData, harvestDate: e.target.value})} />
                        <p className="text-[9px] text-emerald-600 mt-1 italic text-right">*Auto (+105 hari) atau manual</p>
                    </div>
                    <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Rekomendasi Kunjungan Berikutnya</label>
                        <div className="flex gap-2">
                            <div className="bg-white p-1 rounded-xl flex space-x-1 border border-slate-200 w-fit">
                                <button type="button" onClick={() => setScheduleType('auto')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center transition-all ${scheduleType === 'auto' ? 'bg-slate-100 text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}><Clock size={12} className="mr-1" /> Auto</button>
                                <button type="button" onClick={() => setScheduleType('manual')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center transition-all ${scheduleType === 'manual' ? 'bg-slate-100 text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}><Calendar size={12} className="mr-1" /> Manual</button>
                            </div>
                            <input required type="date" disabled={scheduleType === 'auto'} className={`flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-emerald-500 transition-colors ${scheduleType === 'auto' ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed font-bold' : 'bg-white text-slate-700 border-slate-300'}`} value={formData.nextVisit} onChange={e => setFormData({...formData, nextVisit: e.target.value})} />
                        </div>
                        {scheduleType === 'auto' && (
                            <div className={`mt-2 text-[10px] flex items-center px-2 py-1.5 rounded-lg border w-fit ${calculation.status === 'sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {calculation.status !== 'sehat' && <AlertTriangle size={12} className="mr-1.5" />}
                                {autoScheduleReason}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center"><Leaf size={16} className="mr-2 text-emerald-600"/> Parameter Fisik (Kalkulator)</h3>
                  {(parameters.water === '' || parameters.fertilizer === '' || parameters.pest === '') && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center"><AlertCircle size={10} className="mr-1"/> Wajib Diisi</span>
                  )}
              </div>
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border transition-all ${parameters.water === '' ? 'bg-red-50/30 border-red-200' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-blue-800 flex items-center"><Droplets size={14} className="mr-1"/> Ketersediaan Air</label>
                    <span className="text-[10px] font-bold bg-blue-200 text-blue-700 px-2 rounded-full">Bobot 40%</span>
                  </div>
                  <select required className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" value={parameters.water} onChange={(e) => setParameters({...parameters, water: e.target.value})}>
                    <option value="" disabled>-- Pilih Kondisi Air --</option>
                    <option value="100">🌊 Melimpah / Irigasi Lancar (100 pts)</option>
                    <option value="80">💧 Cukup (Tadah Hujan Normal) (80 pts)</option>
                    <option value="50">⚠️ Kurang (50 pts)</option>
                    <option value="20">🔥 Kering / Kemarau Panjang (20 pts)</option>
                  </select>
                </div>
                <div className={`p-3 rounded-xl border transition-all ${parameters.fertilizer === '' ? 'bg-red-50/30 border-red-200' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-emerald-800 flex items-center"><Sprout size={14} className="mr-1"/> Tanaman & Pupuk</label>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-700 px-2 rounded-full">Bobot 30%</span>
                  </div>
                  <select required className="w-full p-2 text-sm bg-white border border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400" value={parameters.fertilizer} onChange={(e) => setParameters({...parameters, fertilizer: e.target.value})}>
                    <option value="" disabled>-- Pilih Kondisi Tanaman --</option>
                    <option value="100">🌿 Subur / Pemupukan Rutin (100 pts)</option>
                    <option value="70">🌱 Standar (70 pts)</option>
                    <option value="40">🍂 Kurang Nutrisi / Kuning (40 pts)</option>
                  </select>
                </div>
                <div className={`p-3 rounded-xl border transition-all ${parameters.pest === '' ? 'bg-red-50/30 border-red-200' : 'bg-red-50/50 border-red-100'}`}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-red-800 flex items-center"><Bug size={14} className="mr-1"/> Hama & Penyakit</label>
                    <span className="text-[10px] font-bold bg-red-200 text-red-700 px-2 rounded-full">Bobot 30%</span>
                  </div>
                  <select required className="w-full p-2 text-sm bg-white border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400" value={parameters.pest} onChange={(e) => setParameters({...parameters, pest: e.target.value})}>
                    <option value="" disabled>-- Pilih Intensitas Hama --</option>
                    <option value="100">🛡️ Nihil / Sehat (100 pts)</option>
                    <option value="70">🦗 Ada Sedikit (70 pts)</option>
                    <option value="40">⚠️ Serangan Sedang (40 pts)</option>
                    <option value="10">☠️ Puso / Gagal Panen (10 pts)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 transition-colors ${calculation.status === 'sehat' ? 'bg-emerald-50 border-emerald-100' : calculation.status === 'waspada' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 text-center">Hasil Analisis Sistem (Real-time)</p>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center"><div className="text-2xl font-bold text-slate-800">{calculation.score}<span className="text-sm text-slate-500">/100</span></div><div className="text-[10px] font-bold uppercase text-slate-400">Skor</div></div>
                <div className="h-8 w-px bg-slate-300"></div>
                <div className="text-center"><div className={`text-lg font-bold uppercase ${calculation.status === 'sehat' ? 'text-emerald-600' : calculation.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>{calculation.status}</div><div className="text-[10px] font-bold uppercase text-slate-400">Status</div></div>
                 <div className="h-8 w-px bg-slate-300"></div>
                <div className="text-center"><div className="text-xl font-bold text-slate-800">{calculation.failureRisk}%</div><div className="text-[10px] font-bold uppercase text-red-400">Resiko Gagal</div></div>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-xs flex justify-between font-mono text-slate-600">
                <span>Prediksi: <b>{calculation.prediction}</b></span>
                <span>Nilai: <b>{calculation.value}</b></span>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm">Batal</button>
          <button type="submit" form="addFarmForm" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-transform active:scale-95 text-sm flex items-center"><Save size={18} className="mr-2" /> Simpan Analisis</button>
        </div>
      </div>
    </div>
  );
};

export default AddDataModal;