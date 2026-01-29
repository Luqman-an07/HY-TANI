import React from 'react';
import { AlertTriangle, LogOut, Database, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmLabel = 'Ya, Lanjutkan' }) => {
  if (!isOpen) return null;

  // Konfigurasi Tampilan Berdasarkan Tipe
  const config = {
    danger: {
      icon: <LogOut size={24} className="text-red-600" />,
      bgIcon: 'bg-red-100',
      btnColor: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      textColor: 'text-red-700'
    },
    info: {
      icon: <Database size={24} className="text-blue-600" />,
      bgIcon: 'bg-blue-100',
      btnColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      textColor: 'text-blue-700'
    },
    success: {
        icon: <Database size={24} className="text-emerald-600" />,
        bgIcon: 'bg-emerald-100',
        btnColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
        textColor: 'text-emerald-700'
      }
  };

  const style = config[type] || config.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Tombol Close X */}
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
        </button>

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 ${style.bgIcon} rounded-full flex items-center justify-center mb-4`}>
            {style.icon}
          </div>

          {/* Text */}
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              Batal
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm ${style.btnColor}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;