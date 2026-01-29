import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Save, UploadCloud, Smartphone, 
  Sprout, FileText, CheckCircle, Edit3, X, RefreshCw, Loader2, Map
} from 'lucide-react';
import { getProvinces, getRegencies, getDistricts, getVillages, getCoordinates } from '../lib/locationApi';

const ProfileView = ({ user, farms, onSaveProfile, isOffline, offlineQueueCount, onSync }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isInitializingForm, setIsInitializingForm] = useState(false); 
  
  // State Data Wilayah (Dropdown Options)
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    full_name: '',
    provinceId: '', provinceName: '',
    regencyId: '', regencyName: '',
    districtId: '', districtName: '',
    villageId: '', villageName: '',
    lat: '',
    lng: ''
  });

  // 1. LOAD DATA DARI DATABASE (Initial State)
  // Ini menjamin data yang tampil adalah data yang tersimpan di DB
  useEffect(() => {
    if (user) {
      const vData = user.villageData || {};
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || user.user_metadata?.full_name || '',
        // Muat nama wilayah dari DB (Display Only sebelum Edit)
        provinceName: vData.province || '',
        regencyName: vData.regency || '',
        districtName: vData.subDistrict || '',
        villageName: vData.villageName || '',
        // Muat Koordinat dari DB (PENTING: Agar peta tidak loncat)
        lat: vData.lat || '',
        lng: vData.lng || ''
      }));
    }
  }, [user]);

  // 2. SINKRONISASI DATA DB KE DROPDOWN API (Saat Edit Diklik)
  // Ini menjamin ID dropdown sesuai dengan Nama yang ada di DB
  useEffect(() => {
    const initializeEditMode = async () => {
        if (!isEditing || !user?.villageData) return;
        
        setIsInitializingForm(true);
        try {
            const { province, regency, subDistrict, villageName } = user.villageData;

            // A. Load Provinsi & Cari ID
            const provList = await getProvinces();
            setProvinces(provList);
            const foundProv = provList.find(p => p.name.toUpperCase() === province?.toUpperCase());
            
            if (foundProv) {
                setFormData(prev => ({ ...prev, provinceId: foundProv.id }));

                // B. Load Kabupaten & Cari ID
                const regList = await getRegencies(foundProv.id);
                setRegencies(regList);
                const foundReg = regList.find(r => r.name.toUpperCase() === regency?.toUpperCase());

                if (foundReg) {
                    setFormData(prev => ({ ...prev, regencyId: foundReg.id }));

                    // C. Load Kecamatan & Cari ID
                    const distList = await getDistricts(foundReg.id);
                    setDistricts(distList);
                    const foundDist = distList.find(d => d.name.toUpperCase() === subDistrict?.toUpperCase());

                    if (foundDist) {
                        setFormData(prev => ({ ...prev, districtId: foundDist.id }));

                        // D. Load Desa & Cari ID
                        const vilList = await getVillages(foundDist.id);
                        setVillages(vilList);
                        const foundVil = vilList.find(v => v.name.toUpperCase() === villageName?.toUpperCase());

                        if (foundVil) {
                            setFormData(prev => ({ ...prev, villageId: foundVil.id }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Gagal sinkronisasi wilayah:", error);
        } finally {
            setIsInitializingForm(false);
        }
    };

    if (isEditing) {
        initializeEditMode();
    }
  }, [isEditing, user]);

  // --- HANDLER PERUBAHAN DROPDOWN ---
  
  const handleProvinceChange = async (e) => {
      const id = e.target.value;
      const index = e.target.selectedIndex;
      const name = index > 0 ? e.target.options[index].text : '';
      
      setFormData(prev => ({ 
          ...prev, provinceId: id, provinceName: name, 
          regencyId: '', regencyName: '', districtId: '', districtName: '', villageId: '', villageName: '' 
      }));
      setRegencies([]); setDistricts([]); setVillages([]);
      if (id) {
          const data = await getRegencies(id);
          setRegencies(data);
      }
  };

  const handleRegencyChange = async (e) => {
      const id = e.target.value;
      const index = e.target.selectedIndex;
      const name = index > 0 ? e.target.options[index].text : '';

      setFormData(prev => ({ 
          ...prev, regencyId: id, regencyName: name, 
          districtId: '', districtName: '', villageId: '', villageName: '' 
      }));
      setDistricts([]); setVillages([]);
      if (id) {
          const data = await getDistricts(id);
          setDistricts(data);
      }
  };

  const handleDistrictChange = async (e) => {
      const id = e.target.value;
      const index = e.target.selectedIndex;
      const name = index > 0 ? e.target.options[index].text : '';

      setFormData(prev => ({ 
          ...prev, districtId: id, districtName: name, 
          villageId: '', villageName: '' 
      }));
      setVillages([]);
      if (id) {
          const data = await getVillages(id);
          setVillages(data);
      }
  };

  // LOGIKA UTAMA KONSISTENSI DATA
  const handleVillageChange = async (e) => {
      const id = e.target.value;
      const index = e.target.selectedIndex;
      const name = index > 0 ? e.target.options[index].text : '';
      
      setFormData(prev => ({ ...prev, villageId: id, villageName: name }));

      // Hanya update koordinat jika Desa BENAR-BENAR BERUBAH atau ID valid
      if (id && navigator.onLine) {
          setIsLoadingLocation(true);
          const coords = await getCoordinates(name, formData.districtName, formData.regencyName, formData.provinceName);
          if (coords) {
              setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }));
          } else {
              // Jangan kosongkan lat/lng jika gagal, pakai yang lama sebagai fallback aman
              alert("Koordinat otomatis tidak ditemukan. Menggunakan data lokasi terakhir.");
          }
          setIsLoadingLocation(false);
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.villageId) {
        alert("Mohon lengkapi data wilayah hingga tingkat Desa.");
        return;
    }
    const profileData = {
      villageName: formData.villageName,
      subDistrict: formData.districtName, 
      regency: formData.regencyName,
      province: formData.provinceName,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng)
    };
    onSaveProfile(profileData);
    setIsEditing(false);
  };

  const totalFarms = farms.length;
  const totalArea = farms.reduce((acc, curr) => acc + (parseFloat(curr.size) || 0), 0).toFixed(2);
  const healthyFarms = farms.filter(f => f.status === 'sehat').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HEADER PROFILE CARD */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-20 -mt-20 z-0"></div>
        
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-bold border-4 border-white shadow-lg shrink-0 z-10">
           {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'K'}
        </div>
        
        <div className="text-center md:text-left flex-1 z-10">
           <h1 className="text-2xl font-bold text-slate-800">{formData.full_name || 'Komunikator'}</h1>
           <p className="text-emerald-600 font-bold text-sm bg-emerald-50 w-fit px-3 py-1 rounded-full mx-auto md:mx-0 mt-1 mb-3 border border-emerald-100">
             Komunikator Lapangan
           </p>
           
           <div className="flex flex-col md:flex-row md:items-center text-slate-500 text-sm space-y-1 md:space-y-0 md:space-x-4">
              <div className="flex items-center justify-center md:justify-start">
                <MapPin size={16} className="mr-1.5 text-slate-400"/> 
                {formData.villageName ? `${formData.villageName}, ${formData.districtName}, ${formData.regencyName}` : 'Wilayah belum diset'}
              </div>
              <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center justify-center md:justify-start">
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center">
                  <Map size={12} className="mr-1"/>
                  {formData.lat ? `${parseFloat(formData.lat).toFixed(4)}, ${parseFloat(formData.lng).toFixed(4)}` : 'No Coords'}
                </span>
              </div>
           </div>
        </div>

        <button 
            onClick={() => setIsEditing(!isEditing)} 
            disabled={isInitializingForm}
            className={`z-10 flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'} disabled:opacity-50`}
        >
          {isInitializingForm ? <Loader2 size={16} className="mr-2 animate-spin"/> : (isEditing ? <X size={16} className="mr-2"/> : <Edit3 size={16} className="mr-2"/>)}
          {isInitializingForm ? 'Memuat...' : (isEditing ? 'Batal' : 'Edit Data')}
        </button>
      </div>

      {/* 2. FORM EDIT (Dropdown Wilayah) */}
      {isEditing && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-emerald-100 animate-in zoom-in-95 duration-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Edit3 size={18} className="mr-2 text-emerald-600"/> Update Wilayah Kerja
          </h3>
          
          {isInitializingForm ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin"/>
                  <p className="text-sm text-slate-500">Sinkronisasi data wilayah...</p>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nama */}
                <div className="md:col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                   <input type="text" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 cursor-not-allowed" value={formData.full_name} disabled />
                </div>

                {/* Provinsi */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Provinsi <span className="text-red-500">*</span></label>
                   <select required className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.provinceId} onChange={handleProvinceChange}>
                       <option value="">-- Pilih Provinsi --</option>
                       {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>

                {/* Kabupaten */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Kabupaten/Kota <span className="text-red-500">*</span></label>
                   <select required disabled={!formData.provinceId} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50" value={formData.regencyId} onChange={handleRegencyChange}>
                       <option value="">-- Pilih Kabupaten --</option>
                       {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                   </select>
                </div>

                {/* Kecamatan */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Kecamatan <span className="text-red-500">*</span></label>
                   <select required disabled={!formData.regencyId} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50" value={formData.districtId} onChange={handleDistrictChange}>
                       <option value="">-- Pilih Kecamatan --</option>
                       {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>

                {/* Desa */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Desa/Kelurahan <span className="text-red-500">*</span></label>
                   <select required disabled={!formData.districtId} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50" value={formData.villageId} onChange={handleVillageChange}>
                       <option value="">-- Pilih Desa --</option>
                       {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                   </select>
                </div>

                {/* Auto Coordinates */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Latitude (Otomatis)</label>
                   <div className="relative">
                       <input type="number" step="any" readOnly className="w-full mt-1 p-2 pl-8 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none text-slate-600" value={formData.lat} placeholder="Otomatis..." />
                       <MapPin size={14} className="absolute top-3.5 left-2.5 text-slate-400"/>
                       {isLoadingLocation && <Loader2 size={14} className="absolute top-3.5 right-3 animate-spin text-emerald-600"/>}
                   </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Longitude (Otomatis)</label>
                   <div className="relative">
                       <input type="number" step="any" readOnly className="w-full mt-1 p-2 pl-8 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none text-slate-600" value={formData.lng} placeholder="Otomatis..." />
                       <MapPin size={14} className="absolute top-3.5 left-2.5 text-slate-400"/>
                       {isLoadingLocation && <Loader2 size={14} className="absolute top-3.5 right-3 animate-spin text-emerald-600"/>}
                   </div>
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                   <button type="submit" disabled={isLoadingLocation || !formData.villageId} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                     {isLoadingLocation ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>} 
                     {isLoadingLocation ? 'Mencari Koordinat...' : 'Simpan Perubahan'}
                   </button>
                </div>
              </form>
          )}
        </div>
      )}

      {/* 3. GRID STATISTIK & DEVICE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STATISTIK KINERJA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center"><FileText size={18} className="mr-2 text-slate-400"/> Statistik Kinerja</h3>
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:bg-emerald-50 hover:border-emerald-100 transition-colors group">
                 <p className="text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{totalFarms}</p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Total Petani</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:bg-blue-50 hover:border-blue-100 transition-colors group">
                 <p className="text-3xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{totalArea} <span className="text-sm text-slate-400 font-normal">Ha</span></p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Luas Terdata</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:bg-amber-50 hover:border-amber-100 transition-colors group">
                 <p className="text-3xl font-black text-slate-800 group-hover:text-amber-600 transition-colors">{healthyFarms}</p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Lahan Sehat</p>
              </div>
           </div>
           
           <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start space-x-3">
              <Sprout className="text-emerald-600 shrink-0 mt-0.5" size={20}/>
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Tips Data Akurat</h4>
                <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                  Data wilayah yang Anda pilih akan digunakan untuk kalibrasi peta satelit. Pastikan memilih Desa/Kelurahan yang benar agar titik koordinat otomatis presisi.
                </p>
              </div>
           </div>
        </div>

        {/* STATUS PERANGKAT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center"><Smartphone size={18} className="mr-2 text-slate-400"/> Status Perangkat</h3>
           
           <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <span className="text-xs font-bold text-slate-500">Koneksi</span>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded border ${isOffline ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    {isOffline ? 'OFFLINE' : 'ONLINE'}
                 </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <span className="text-xs font-bold text-slate-500">Antrian Sync</span>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded border ${offlineQueueCount > 0 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                    {offlineQueueCount} Data
                 </span>
              </div>
           </div>
           
           <div className="mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={onSync}
                disabled={isOffline || offlineQueueCount === 0}
                className="w-full flex items-center justify-center space-x-2 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <UploadCloud size={18}/> <span>Sync Manual</span>
              </button>
              {offlineQueueCount > 0 && isOffline && (
                <p className="text-[10px] text-center text-amber-600 mt-2 italic">Hubungkan internet untuk sync.</p>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileView;