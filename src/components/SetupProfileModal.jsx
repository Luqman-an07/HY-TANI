import React, { useState, useEffect } from 'react';
import { MapPin, Building, Save, Map as MapIcon, Info, Loader2, Home } from 'lucide-react';
import { getProvinces, getRegencies, getDistricts, getVillages, getCoordinates } from '../lib/locationApi';

const SetupProfileModal = ({ isOpen, onSave, userName }) => {
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // State Data Wilayah (List Dropdown)
  const [listProvinces, setListProvinces] = useState([]);
  const [listRegencies, setListRegencies] = useState([]);
  const [listDistricts, setListDistricts] = useState([]);
  const [listVillages, setListVillages] = useState([]);

  // State Form Data
  const [formData, setFormData] = useState({
    provinceId: '', provinceName: '',
    regencyId: '', regencyName: '',
    districtId: '', districtName: '',
    villageId: '', villageName: '',
    lat: '',
    lng: ''
  });

  // Load Provinsi saat Modal Dibuka
  useEffect(() => {
    if (isOpen) {
      getProvinces().then(data => setListProvinces(data));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIKA HANDLER DROPDOWN ---

  const handleProvinceChange = async (e) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const name = index > 0 ? e.target.options[index].text : '';
    
    setFormData(prev => ({ 
        ...prev, provinceId: id, provinceName: name, 
        regencyId: '', regencyName: '', districtId: '', districtName: '', villageId: '', villageName: '', lat: '', lng: '' 
    }));
    setListRegencies([]); setListDistricts([]); setListVillages([]);
    if(id) setListRegencies(await getRegencies(id));
  };

  const handleRegencyChange = async (e) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const name = index > 0 ? e.target.options[index].text : '';

    setFormData(prev => ({ 
        ...prev, regencyId: id, regencyName: name, 
        districtId: '', districtName: '', villageId: '', villageName: '', lat: '', lng: '' 
    }));
    setListDistricts([]); setListVillages([]);
    if(id) setListDistricts(await getDistricts(id));
  };

  const handleDistrictChange = async (e) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const name = index > 0 ? e.target.options[index].text : '';

    setFormData(prev => ({ 
        ...prev, districtId: id, districtName: name, 
        villageId: '', villageName: '', lat: '', lng: '' 
    }));
    setListVillages([]);
    if(id) setListVillages(await getVillages(id));
  };

  const handleVillageChange = async (e) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const name = index > 0 ? e.target.options[index].text : '';
    
    // Set data desa
    setFormData(prev => ({ ...prev, villageId: id, villageName: name }));

    // AUTO GEOCODING: Cari Lat/Lng otomatis
    if (id && navigator.onLine) {
        setLoadingLocation(true);
        const coords = await getCoordinates(name, formData.districtName, formData.regencyName, formData.provinceName);
        
        if (coords) {
            setFormData(prev => ({ ...prev, villageId: id, villageName: name, lat: coords.lat, lng: coords.lng }));
        } else {
            alert("Koordinat otomatis tidak ditemukan untuk desa ini. Pastikan koneksi internet lancar.");
        }
        setLoadingLocation(false);
    }
  };

  // --- LOGIKA 3T ---
  const checkIs3T = () => {
    const keywords3T = [
      'papua', 'nusa tenggara', 'ntt', 'ntb', 'maluku', 
      'nias', 'mentawai', 'sula', 'taliabu', 'morotai', 
      'biak', 'supiori', 'keerom', 'boven', 'mahra', 
      'aru', 'animha', 'pelosok', 'hulu', 'perbatasan'
    ];
    const combinedText = `${formData.provinceName} ${formData.regencyName} ${formData.districtName}`.toLowerCase();
    return keywords3T.some(keyword => combinedText.includes(keyword));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Validasi Kolom Wilayah (Manual Check untuk Alert)
    if (!formData.provinceId || !formData.regencyId || !formData.districtId || !formData.villageId) {
        alert("Mohon lengkapi semua data wilayah (Provinsi, Kabupaten, Kecamatan, Desa) sebelum menyimpan.");
        return;
    }

    // 2. Validasi Koordinat (Karena auto-generated, user harus menunggu)
    if (!formData.lat || !formData.lng) {
        if (loadingLocation) {
            alert("Sedang mengambil titik koordinat desa. Mohon tunggu sebentar...");
        } else {
            alert("Gagal mendapatkan koordinat desa. Mohon pilih ulang desa atau cek koneksi internet.");
        }
        return;
    }

    setLoading(true);
    const is3TRegion = checkIs3T();

    const finalData = {
        villageName: formData.villageName,
        subDistrict: formData.districtName,
        regency: formData.regencyName,
        province: formData.provinceName,
        lat: formData.lat,
        lng: formData.lng,
        is3T: is3TRegion
    };

    setTimeout(() => {
      onSave(finalData);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-center relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
              <MapIcon className="text-white w-8 h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Selamat Datang, {userName}!</h2>
            <p className="text-emerald-100 text-xs md:text-sm mt-1 px-4">Lengkapi wilayah tugas Anda untuk kalibrasi peta otomatis.</p>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-4 md:p-6 overflow-y-auto scroll-smooth">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start mb-5">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 shrink-0" />
            <p className="text-xs text-blue-600 leading-relaxed">
              <span className="font-bold">Info:</span> Pilih wilayah secara berurutan (Provinsi &rarr; Desa). Sistem akan otomatis mendeteksi titik pusat peta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* GRID: Provinsi & Kabupaten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provinsi */}
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Provinsi <span className="text-red-500">*</span></label>
                   <div className="relative">
                       <select required className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer" value={formData.provinceId} onChange={handleProvinceChange}>
                           <option value="">-- Pilih --</option>
                           {listProvinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                       </div>
                   </div>
                </div>

                {/* Kabupaten */}
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kabupaten/Kota <span className="text-red-500">*</span></label>
                   <div className="relative">
                       <select required disabled={!formData.provinceId} className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none cursor-pointer" value={formData.regencyId} onChange={handleRegencyChange}>
                           <option value="">-- Pilih --</option>
                           {listRegencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                       </div>
                   </div>
                </div>
            </div>

            {/* GRID: Kecamatan & Desa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kecamatan */}
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kecamatan <span className="text-red-500">*</span></label>
                   <div className="relative">
                       <select required disabled={!formData.regencyId} className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none cursor-pointer" value={formData.districtId} onChange={handleDistrictChange}>
                           <option value="">-- Pilih --</option>
                           {listDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                       </div>
                   </div>
                </div>

                {/* Desa */}
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Desa/Kelurahan <span className="text-red-500">*</span></label>
                   <div className="relative">
                       <select required disabled={!formData.districtId} className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none cursor-pointer" value={formData.villageId} onChange={handleVillageChange}>
                           <option value="">-- Pilih --</option>
                           {listVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                       </div>
                   </div>
                </div>
            </div>

            {/* Koordinat Otomatis (Full Width) */}
            <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Titik Koordinat Desa (Otomatis)</label>
                <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input 
                        readOnly 
                        type="text" 
                        className="w-full pl-9 pr-3 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-mono text-emerald-800 focus:outline-none" 
                        value={formData.lat ? `${parseFloat(formData.lat).toFixed(5)}, ${parseFloat(formData.lng).toFixed(5)}` : 'Menunggu pemilihan desa...'}
                    />
                    {loadingLocation && (
                        <div className="absolute right-3 top-3.5 flex items-center space-x-2">
                            <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">Mencari...</span>
                            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading || loadingLocation} // Tombol enable meski form kosong, validasi handle di onSubmit
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /><span>Simpan & Masuk Dashboard</span></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupProfileModal;