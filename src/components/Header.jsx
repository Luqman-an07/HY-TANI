import React from 'react';
import { Menu, Search } from 'lucide-react';

const Header = ({ activeTab, isOffline, setSidebarOpen }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-30 shrink-0 sticky top-0">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-4 text-slate-500 hover:text-emerald-700 p-1"><Menu size={24} /></button>
        <h2 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-none">
          {activeTab === 'peta' ? 'Dashboard Pemetaan' : activeTab === 'data' ? 'Rekap Ekonomi' : 'Manajemen Tani'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-2 text-slate-400 w-4 h-4"/>
            <input type="text" placeholder="Cari data..." className="pl-9 pr-4 py-1.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 transition-all"/>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isOffline ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></div>
          <span className="hidden sm:inline">{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;