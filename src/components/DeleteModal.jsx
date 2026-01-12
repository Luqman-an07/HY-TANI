import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, farmName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop Gelap */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Konten Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Merah */}
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Hapus Data Lahan?</h3>
          <p className="text-sm text-slate-500 mt-2">
            Anda akan menghapus lahan milik <br/>
            <span className="font-bold text-slate-800">"{farmName}"</span>.
          </p>
        </div>

        {/* Body & Tombol Aksi */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-center text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
            Tindakan ini permanen dan tidak dapat dibatalkan. Riwayat kunjungan juga akan terhapus.
          </p>

          <div className="flex space-x-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center"
            >
              <Trash2 size={18} className="mr-2" />
              Hapus
            </button>
          </div>
        </div>

        {/* Tombol Close Pojok Kanan Atas */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default DeleteModal;