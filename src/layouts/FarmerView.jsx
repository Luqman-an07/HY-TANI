import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Calendar, 
  Edit, Trash2, Eye, Sprout, CheckSquare, Square, QrCode
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';

// --- HELPER: FORMAT TANGGAL ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }
    return dateStr;
  } catch (e) { return dateStr; }
};

const FarmerView = ({ farms, onAddClick, onEditClick, onDeleteClick, onViewDetail, onDeleteBulk }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false); 
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        setScrolled(scrollTop > 5);
    };
    window.addEventListener('scroll', handleScroll); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, filterStatus, farms]);

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.farmer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          farm.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || farm.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleScan = (scannedId) => {
      const foundFarm = farms.find(f => f.id.toString() === scannedId);
      if (foundFarm) { onViewDetail(foundFarm); } 
      else { alert("Data tidak ditemukan!"); }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredFarms.length) { setSelectedIds([]); } 
    else { setSelectedIds(filteredFarms.map(f => f.id)); }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) { setSelectedIds(selectedIds.filter(itemId => itemId !== id)); } 
    else { setSelectedIds([...selectedIds, id]); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-screen flex flex-col">
      
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScan} />

      {/* ============================================================ */}
      {/* STICKY HEADER AREA */}
      {/* ============================================================ */}
      {/* PERUBAHAN: 
          1. Hapus '-mx-4' karena parent container sekarang p-0.
          2. Tambahkan 'px-4 md:px-0' agar konten di mobile tidak mepet pinggir layar.
      */}
      <div className={`sticky top-0 z-30 transition-all duration-200 px-4 md:px-0 ${scrolled ? 'bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-2' : 'bg-slate-50 py-4'}`}>
        
        <div className={`bg-white rounded-b-2xl md:rounded-2xl border-x border-b md:border border-slate-200 shadow-sm transition-all duration-200 ${scrolled ? 'rounded-t-none border-t-0 p-3 md:p-4' : 'rounded-t-2xl p-4'}`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4">
                
                {/* Title */}
                <div className={`${scrolled ? 'hidden lg:block' : 'block'} w-full lg:w-auto`}>
                    <h2 className="text-lg md:text-xl font-bold text-slate-800">Data Petani</h2>
                    <p className="text-xs text-slate-500">Total {filteredFarms.length} lahan terdaftar</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Cari nama petani..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Filter className="absolute left-3 top-2.5 text-slate-400 w-4 h-4 pointer-events-none" />
                            <select 
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer text-slate-600 font-medium"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Semua</option>
                                <option value="sehat">Sehat</option>
                                <option value="waspada">Waspada</option>
                                <option value="bahaya">Bahaya</option>
                            </select>
                        </div>

                        <button onClick={() => setIsScannerOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center shrink-0 active:scale-95 transition-transform" title="Scan QR">
                            <QrCode size={18} className="md:mr-2"/> <span className="hidden md:inline">Scan</span>
                        </button>

                        {selectedIds.length > 0 ? (
                            <button onClick={() => onDeleteBulk(selectedIds)} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 flex items-center justify-center whitespace-nowrap animate-in zoom-in duration-200">
                                <Trash2 size={16} className="mr-2"/> <span className="hidden sm:inline">Hapus</span> ({selectedIds.length})
                            </button>
                        ) : (
                            <button onClick={onAddClick} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center whitespace-nowrap shrink-0 active:scale-95 transition-transform">
                                + <span className="hidden sm:inline ml-1">Data</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Column Headers (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider items-center bg-white rounded-lg border border-slate-200 shadow-sm mx-1">
            <div className="col-span-1 flex justify-center">
                <button onClick={handleSelectAll} className="hover:text-emerald-600 transition-colors">
                    {selectedIds.length > 0 && selectedIds.length === filteredFarms.length ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                </button>
            </div>
            <div className="col-span-3">Identitas Petani & Lahan</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Metrik Pertanian</div>
            <div className="col-span-2">Jadwal Visit</div>
            <div className="col-span-1 text-right">Aksi</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SCROLLABLE LIST CONTENT */}
      {/* ============================================================ */}
      {/* PERUBAHAN:
          1. pt-0: Menempel langsung ke header (tidak ada gap).
          2. px-4 md:px-1: Memberikan margin kiri-kanan di mobile agar card tidak nempel pinggir layar.
      */}
      <div className="flex-1 space-y-3 relative z-0 pt-0 md:pt-2 px-4 md:px-1">
        {filteredFarms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 mt-4 mx-0 md:mx-0">
            <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data ditemukan.</p>
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const isSelected = selectedIds.includes(farm.id);
            return (
            <div 
              key={farm.id} 
              className={`rounded-xl border p-4 transition-all duration-200 group relative ${isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:shadow-md'}`}
            >
              <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${farm.status === 'sehat' ? 'bg-emerald-500' : farm.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3 md:gap-4 items-center">
                
                {/* 1. CHECKBOX & HEADER MOBILE */}
                <div className="col-span-1 md:col-span-1 flex flex-row md:justify-center items-center justify-between mb-1 md:mb-0">
                    <button onClick={() => handleSelectOne(farm.id)} className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        {isSelected ? <CheckSquare size={20} className="text-emerald-600"/> : <Square size={20}/>}
                    </button>
                    <div className="md:hidden">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${farm.status === 'sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : farm.status === 'waspada' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {farm.status}
                      </div>
                    </div>
                </div>

                {/* 2. IDENTITAS */}
                <div className="col-span-1 md:col-span-3 pl-2 md:pl-0">
                  <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{farm.farmer}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin size={12} className="mr-1 shrink-0" /> <span className="truncate">{farm.name}</span>
                  </div>
                </div>

                {/* 3. STATUS (Desktop Only) */}
                <div className="hidden md:block col-span-1 md:col-span-2">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${farm.status === 'sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : farm.status === 'waspada' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${farm.status === 'sehat' ? 'bg-emerald-500' : farm.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                    {farm.status}
                  </div>
                </div>

                {/* 4. METRIK (Grid Layout Mobile) */}
                <div className="col-span-1 md:col-span-3 pl-2 md:pl-0">
                  <div className="grid grid-cols-2 md:flex md:items-center md:space-x-4 gap-2 text-xs">
                      <div className="bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg border md:border-none border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Luas</span>
                        <span className="font-bold text-slate-700">{farm.size} Ha</span>
                      </div>
                      <div className="hidden md:block h-6 w-px bg-slate-100"></div>
                      <div className="bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg border md:border-none border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Prediksi</span>
                        <span className="font-bold text-slate-700">{farm.prediction}</span>
                      </div>
                  </div>
                </div>

                {/* 5. JADWAL VISIT */}
                <div className="col-span-1 md:col-span-2 pl-2 md:pl-0">
                  <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 w-full md:w-fit px-3 py-2 md:py-1 rounded-lg border border-slate-100">
                    <Calendar size={14} className="mr-2 text-blue-500 shrink-0"/>
                    <span className="md:hidden mr-1">Visit:</span> {formatDate(farm.nextVisit)}
                  </div>
                </div>

                {/* 6. AKSI (Mobile: Full Width Buttons) */}
                <div className="col-span-1 md:col-span-1 flex items-center justify-end space-x-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                    <button onClick={() => onViewDetail(farm)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 md:flex-none flex justify-center border md:border-none border-blue-100 bg-blue-50/50 md:bg-transparent items-center" title="Lihat Detail">
                      <Eye size={18} /> <span className="md:hidden ml-2 text-xs font-bold">Detail</span>
                    </button>
                    <button onClick={() => onEditClick(farm)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex-1 md:flex-none flex justify-center border md:border-none border-slate-100 bg-slate-50 md:bg-transparent items-center" title="Edit">
                      <Edit size={18} /> <span className="md:hidden ml-2 text-xs font-bold">Edit</span>
                    </button>
                    <button onClick={() => onDeleteClick(farm)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-1 md:flex-none flex justify-center border md:border-none border-slate-100 bg-slate-50 md:bg-transparent items-center" title="Hapus">
                      <Trash2 size={18} /> <span className="md:hidden ml-2 text-xs font-bold">Hapus</span>
                    </button>
                </div>

              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
};

export default FarmerView;