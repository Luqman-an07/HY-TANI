import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Calendar, 
  Edit, Trash2, Eye, Sprout, CheckSquare, Square, XCircle
} from 'lucide-react';

// --- HELPER: FORMAT TANGGAL INDONESIA ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  return dateStr;
};

const FarmerView = ({ farms, onAddClick, onEditClick, onDeleteClick, onViewDetail, onDeleteBulk }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // STATE BARU: Menampung ID yang dipilih
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset seleksi jika filter/search berubah agar tidak salah hapus
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, filterStatus, farms]);

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.farmer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          farm.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || farm.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // --- LOGIKA SELEKSI ---
  const handleSelectAll = () => {
    if (selectedIds.length === filteredFarms.length) {
      setSelectedIds([]); // Unselect All
    } else {
      setSelectedIds(filteredFarms.map(f => f.id)); // Select All Visible
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Data Petani & Lahan</h2>
          <p className="text-xs text-slate-500">Total {filteredFarms.length} data ditemukan</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          
          {/* SEARCH & FILTER (Sembunyikan jika mode hapus aktif di mobile untuk hemat tempat, opsional) */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama petani..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <select 
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="sehat">Sehat</option>
              <option value="waspada">Waspada</option>
              <option value="bahaya">Bahaya</option>
            </select>
          </div>

          {/* TOMBOL AKSI: Ganti antara "Tambah" dan "Hapus Terpilih" */}
          {selectedIds.length > 0 ? (
             <button 
                onClick={() => onDeleteBulk(selectedIds)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 transition-transform active:scale-95 flex items-center justify-center whitespace-nowrap animate-in zoom-in duration-200"
             >
               <Trash2 size={16} className="mr-2"/> Hapus ({selectedIds.length})
             </button>
          ) : (
             <button 
                onClick={onAddClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-transform active:scale-95 flex items-center justify-center whitespace-nowrap"
             >
                + Tambah Data
             </button>
          )}
        </div>
      </div>

      {/* HEADER KOLOM (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider items-center">
        <div className="col-span-1 flex justify-center">
            {/* CHECKBOX SELECT ALL */}
            <button onClick={handleSelectAll} className="hover:text-emerald-600 transition-colors">
                {selectedIds.length > 0 && selectedIds.length === filteredFarms.length ? (
                    <CheckSquare size={18} className="text-emerald-600" />
                ) : (
                    <Square size={18} />
                )}
            </button>
        </div>
        <div className="col-span-3">Identitas Petani & Lahan</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3">Metrik Pertanian</div>
        <div className="col-span-2">Jadwal Visit</div>
        <div className="col-span-1 text-right">Aksi</div>
      </div>

      {/* LIST VIEW ROWS */}
      <div className="space-y-3">
        {filteredFarms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data petani ditemukan.</p>
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const isSelected = selectedIds.includes(farm.id);
            return (
            <div 
              key={farm.id} 
              className={`rounded-xl border p-4 transition-all duration-200 group relative ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:shadow-md'}`}
            >
              {/* Indikator Status Kiri */}
              <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${farm.status === 'sehat' ? 'bg-emerald-500' : farm.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* 0. CHECKBOX ROW */}
                <div className="col-span-1 flex md:justify-center pl-3 md:pl-0">
                    <button onClick={() => handleSelectOne(farm.id)}>
                        {isSelected ? <CheckSquare size={20} className="text-emerald-600"/> : <Square size={20} className="text-slate-300 hover:text-slate-500"/>}
                    </button>
                </div>

                {/* 1. IDENTITAS */}
                <div className="col-span-1 md:col-span-3 pl-3 md:pl-0">
                  <h3 className="font-bold text-slate-800 text-base">{farm.farmer}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin size={12} className="mr-1" /> {farm.name}
                  </div>
                </div>

                {/* 2. STATUS */}
                <div className="col-span-1 md:col-span-2 pl-3 md:pl-0">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${farm.status === 'sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : farm.status === 'waspada' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${farm.status === 'sehat' ? 'bg-emerald-500' : farm.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                    {farm.status}
                  </div>
                </div>

                {/* 3. METRIK */}
                <div className="col-span-1 md:col-span-3 pl-3 md:pl-0">
                  <div className="flex items-center space-x-4 text-xs">
                     <div>
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Luas</span>
                        <span className="font-bold text-slate-700">{farm.size} Ha</span>
                     </div>
                     <div className="h-6 w-px bg-slate-100"></div>
                     <div>
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Prediksi</span>
                        <span className="font-bold text-slate-700">{farm.prediction}</span>
                     </div>
                  </div>
                </div>

                {/* 4. JADWAL */}
                <div className="col-span-1 md:col-span-2 pl-3 md:pl-0">
                  <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 w-fit px-2 py-1 rounded-lg border border-slate-100">
                    <Calendar size={12} className="mr-2 text-blue-500"/>
                    {formatDate(farm.nextVisit)}
                  </div>
                </div>

                {/* 5. AKSI */}
                <div className="col-span-1 md:col-span-1 flex items-center justify-end space-x-2 pl-3 md:pl-0 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0 mt-2 md:mt-0">
                   <button onClick={() => onViewDetail(farm)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                     <Eye size={18} />
                   </button>
                   <button onClick={() => onEditClick(farm)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Edit">
                     <Edit size={18} />
                   </button>
                   <button onClick={() => onDeleteClick(farm)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                     <Trash2 size={18} />
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