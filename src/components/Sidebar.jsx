import React from 'react';
import { Map as MapIcon, Database, Users, Wifi, WifiOff, Sprout, X } from 'lucide-react';

const MenuButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-800 text-white font-bold shadow-lg ring-1 ring-emerald-700' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="tracking-wide text-sm">{label}</span>
  </button>
);

// Perhatikan penambahan prop 'user' disini
const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab, isOffline, toggleOffline, onLogout, user }) => {
  
  // Ambil inisial nama (Misal: Ahmad Gunawan -> AG)
  const getInitials = (name) => {
    if(!name) return 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="p-6 border-b border-emerald-800 flex justify-between items-center bg-emerald-950/30">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-xl shadow-lg"><Sprout className="w-6 h-6 text-emerald-700" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HY-TANI</h1>
            <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-semibold">Satelit Inklusif</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-emerald-300 hover:text-white p-2 rounded-full hover:bg-emerald-800"><X size={24} /></button>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <MenuButton icon={<MapIcon size={20}/>} label="Peta Satelit" active={activeTab === 'peta'} onClick={() => {setActiveTab('peta'); setIsOpen(false);}} />
        <MenuButton icon={<Database size={20}/>} label="Analisis Panen" active={activeTab === 'data'} onClick={() => {setActiveTab('data'); setIsOpen(false);}} />
        <MenuButton icon={<Users size={20}/>} label="Petani Binaan" active={activeTab === 'petani'} onClick={() => {setActiveTab('petani'); setIsOpen(false);}} />
      </nav>
      
      <div className="p-4 m-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm shadow-inner border-2 border-emerald-600 text-white">
            {getInitials(user?.name)}
          </div>
          <div className="overflow-hidden">
            {/* Tampilkan Nama Asli dari Login */}
            <p className="text-sm font-bold truncate">{user?.name || 'Pengguna'}</p>
            <p className="text-[10px] text-emerald-300 truncate">{user?.role || 'Komunikator Desa'}</p>
          </div>
        </div>
        <button onClick={toggleOffline} className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 mb-3 ${isOffline ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400/30'}`}>
          {isOffline ? <WifiOff size={16}/> : <Wifi size={16}/>}<span>{isOffline ? 'MODE LURING (3T)' : 'MODE DARING'}</span>
        </button>
        <button onClick={onLogout} className="w-full text-xs text-emerald-300 hover:text-white py-2 transition-colors hover:bg-emerald-800/50 rounded-lg">Keluar Aplikasi</button>
      </div>
    </aside>
  );
};

export default Sidebar;