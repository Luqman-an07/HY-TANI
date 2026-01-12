import React, { useState } from 'react';
import { MapPin, Building, Save, Ruler, Map as MapIcon, Info, Home, Search, Loader2 } from 'lucide-react';

const SetupProfileModal = ({ isOpen, onSave, userName }) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false); // State untuk loading pencarian lokasi
  const [formData, setFormData] = useState({
    villageName: '',
    subDistrict: '', 
    regency: '',     
    province: '',
    areaSize: '',
    coordinates: '', // String "lat, lng"
    lat: null,       // Simpan terpisah untuk peta
    lng: null
  });

  if (!isOpen) return null;

  const checkIs3T = (data) => {
    const keywords3T = [
      'papua', 'nusa tenggara', 'ntt', 'ntb', 'maluku', 
      'nias', 'mentawai', 'sula', 'taliabu', 'morotai', 
      'biak', 'supiori', 'keerom', 'boven', 'mahra', 
      'aru', 'animha', 'pelosok', 'hulu', 'perbatasan'
    ];
    const combinedText = `${data.province} ${data.regency} ${data.subDistrict}`.toLowerCase();
    return keywords3T.some(keyword => combinedText.includes(keyword));
  };

  // --- FITUR BARU: GEOCODING (ALAMAT -> KOORDINAT) ---
  const handleSearchLocation = async () => {
    // Validasi input minimal
    if (!formData.regency || !formData.province) {
      alert("Mohon isi minimal Kabupaten dan Provinsi untuk mendeteksi lokasi.");
      return;
    }

    setSearching(true);
    
    try {
      // Query ke OpenStreetMap (Nominatim API - Gratis)
      const query = `${formData.villageName}, ${formData.subDistrict}, ${formData.regency}, ${formData.province}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        // Update State
        setFormData(prev => ({
          ...prev,
          lat: lat,
          lng: lon,
          coordinates: `${lat.toFixed(5)}, ${lon.toFixed(5)}`
        }));
      } else {
        alert("Lokasi spesifik tidak ditemukan. Mencoba level Kabupaten/Provinsi...");
        // Fallback: Cari level provinsi saja jika desa tidak ketemu
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.regency + ' ' + formData.province)}`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        
        if (fbData && fbData.length > 0) {
           const res = fbData[0];
           setFormData(prev => ({
            ...prev,
            lat: parseFloat(res.lat),
            lng: parseFloat(res.lon),
            coordinates: `${parseFloat(res.lat).toFixed(5)}, ${parseFloat(res.lon).toFixed(5)}`
          }));
        } else {
           alert("Gagal mendeteksi lokasi otomatis. Silakan isi koordinat manual.");
        }
      }
    } catch (error) {
      console.error("Error geocoding:", error);
      alert("Terjadi kesalahan koneksi ke server peta.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const is3TRegion = checkIs3T(formData);

    setTimeout(() => {
      // Simpan data lengkap termasuk lat/lng terpisah
      onSave({ ...formData, is3T: is3TRegion });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
        
        <div className="bg-emerald-600 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
              <MapIcon className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Halo, {userName}!</h2>
            <p className="text-emerald-100 text-sm mt-1">Setup lokasi desa untuk kalibrasi satelit.</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start mb-5">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 shrink-0" />
            <p className="text-xs text-blue-600">
              <span className="font-bold">Tips:</span> Isi alamat lengkap lalu klik tombol <b>Cari Lokasi</b> agar peta otomatis mengarah ke desa Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Desa & Kecamatan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nama Desa</label>
                <div className="relative">
                  <Home className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input required type="text" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Suka Makmur" value={formData.villageName} onChange={e => setFormData({...formData, villageName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kecamatan</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input required type="text" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Cth: Pelosok" value={formData.subDistrict} onChange={e => setFormData({...formData, subDistrict: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Kabupaten & Provinsi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kabupaten/Kota</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Cth: Merauke" value={formData.regency} onChange={e => setFormData({...formData, regency: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Provinsi</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Cth: Papua Selatan" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
              </div>
            </div>

            {/* Koordinat Otomatis */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Titik Pusat Wilayah (Auto Detect)</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    readOnly 
                    required 
                    type="text" 
                    className="w-full pl-9 pr-4 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-not-allowed font-mono" 
                    placeholder="Klik tombol cari..." 
                    value={formData.coordinates} 
                  />
                </div>
                
                {/* TOMBOL PENCARI LOKASI NYATA */}
                <button 
                  type="button" 
                  onClick={handleSearchLocation} 
                  disabled={searching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center min-w-[100px]"
                >
                  {searching ? <Loader2 className="animate-spin w-4 h-4" /> : <><Search className="w-4 h-4 mr-1" /> Cari Lokasi</>}
                </button>
              </div>
            </div>

            {/* Luas */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Estimasi Luas Wilayah Tani</label>
              <div className="relative">
                <Ruler className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input required type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Contoh: 150 Hektar" value={formData.areaSize} onChange={e => setFormData({...formData, areaSize: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 mt-4" disabled={loading || !formData.coordinates}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /><span>Simpan Profil & Buka Peta</span></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupProfileModal;