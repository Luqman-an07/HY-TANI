import React from 'react';
import { Sprout, Database, Plus, PlayCircle } from 'lucide-react';

const EmptyState = ({ onAddManual, onLoadDummy }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in duration-300">
      <div className="bg-slate-100 p-6 rounded-full mb-6 relative">
        <div className="absolute inset-0 animate-ping bg-emerald-100 rounded-full opacity-75"></div>
        <Database className="w-16 h-16 text-slate-400 relative z-10" />
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Data Lahan Belum Tersedia</h3>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        Sistem belum mendeteksi data lahan di akun ini. Anda dapat memulai pemetaan manual atau memuat simulasi data satelit untuk demonstrasi.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Tombol Simulasi (Primary untuk Demo) */}
        <button 
          onClick={onLoadDummy}
          className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 active:scale-95 group"
        >
          <PlayCircle size={20} className="group-hover:text-emerald-200" />
          <div className="text-left">
            <span className="block text-xs font-normal text-emerald-100">Rekomendasi Demo</span>
            <span>Muat Data Simulasi</span>
          </div>
        </button>

        {/* Tombol Manual (Secondary) */}
        <button 
          onClick={onAddManual}
          className="flex-1 flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-6 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus size={20} />
          <span>Input Manual</span>
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
        Status: Menunggu Input Data
      </p>
    </div>
  );
};

export default EmptyState;