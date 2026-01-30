import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanLine, Zap, ZapOff, Camera, AlertCircle, Keyboard, ArrowRight } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    const [scanError, setScanError] = useState(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    
    // --- STATE BARU UNTUK INPUT MANUAL ---
    const [isManualInput, setIsManualInput] = useState(false);
    const [manualId, setManualId] = useState('');
    
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        // Hanya jalankan kamera jika modal terbuka DAN bukan mode manual
        const startScanner = async () => {
            if (isOpen && !isManualInput) {
                try {
                    const elementId = "qr-reader-stream";
                    // Cek apakah elemen ada sebelum init
                    if(!document.getElementById(elementId)) return;

                    html5QrCode = new Html5Qrcode(elementId);
                    scannerRef.current = html5QrCode;

                    const config = { 
                        fps: 15, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" }, 
                        config,
                        (decodedText) => handleSuccess(decodedText, html5QrCode),
                        (errorMessage) => { /* ignore */ }
                    );
                } catch (err) {
                    console.error("Camera Error:", err);
                    setScanError("Gagal akses kamera. Pastikan izin diberikan.");
                }
            }
        };

        const timer = setTimeout(() => {
            if(isOpen && !isManualInput) startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(err => console.error(err));
            }
        };
    }, [isOpen, isManualInput]); // Re-run jika mode berubah

    const handleSuccess = (decodedText, instance) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
        
        onScanSuccess(decodedText);
        
        if(instance) {
            instance.stop().then(() => { instance.clear(); onClose(); }).catch(console.error);
        } else {
            onClose();
        }
    };

    // Handler Submit Manual
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            handleSuccess(manualId, scannerRef.current);
        }
    };

    const toggleFlash = () => {
        if (scannerRef.current) {
            scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !isFlashOn }] })
            .then(() => setIsFlashOn(!isFlashOn))
            .catch(() => alert("Fitur Flash tidak didukung."));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/90 to-transparent">
                {!isManualInput ? (
                    <button onClick={toggleFlash} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                        {isFlashOn ? <Zap size={20} className="text-yellow-400 fill-yellow-400"/> : <ZapOff size={20} className="text-slate-300"/>}
                    </button>
                ) : (
                    <button onClick={() => setIsManualInput(false)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                        <Camera size={20} className="text-emerald-400"/>
                    </button>
                )}
                
                <h3 className="font-bold text-lg tracking-wide flex items-center">
                    {isManualInput ? <Keyboard className="mr-2 text-emerald-400" size={20}/> : <ScanLine className="mr-2 text-emerald-400" size={20}/>}
                    {isManualInput ? 'Input Manual' : 'Scan QR Lahan'}
                </h3>

                <button onClick={onClose} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-red-500/50 hover:border-red-500 transition-all">
                    <X size={20} className="text-white"/>
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative flex flex-col justify-center items-center overflow-hidden bg-black">
                
                {/* --- MODE 1: KAMERA SCANNER --- */}
                {!isManualInput && (
                    <>
                        <div id="qr-reader-stream" className="w-full h-full object-cover"></div>

                        {scanError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30">
                                <AlertCircle className="text-red-500 w-12 h-12 mb-4"/>
                                <p className="text-white font-bold">{scanError}</p>
                            </div>
                        )}

                        {!scanError && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="absolute inset-0 border-[50px] md:border-[100px] border-black/60 backdrop-blur-[2px]"></div>
                                <div className="relative w-64 h-64 md:w-80 md:h-80 border-2 border-emerald-500/30 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.3)] box-border">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl -mb-1 -mr-1"></div>
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan-laser"></div>
                                </div>
                            </div>
                        )}

                        {!scanError && (
                            <div className="absolute bottom-32 z-20 text-center px-6">
                                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2 animate-pulse">Mencari Kode...</p>
                                <p className="text-slate-300 text-xs max-w-xs mx-auto leading-relaxed">Arahkan kamera ke QR Code lahan.</p>
                            </div>
                        )}
                    </>
                )}

                {/* --- MODE 2: FORM INPUT MANUAL --- */}
                {isManualInput && (
                    <div className="w-full max-w-sm px-6 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                            <div className="text-center mb-4">
                                <Keyboard size={48} className="text-emerald-500 mx-auto mb-3 opacity-80"/>
                                <h3 className="text-xl font-bold text-white">Masukkan ID Lahan</h3>
                                <p className="text-slate-400 text-sm">Lihat ID pada kartu fisik atau dokumen.</p>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    placeholder="Contoh: 1738204..."
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white text-center text-lg font-mono font-bold py-4 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                                    autoFocus
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={!manualId.trim()}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                            >
                                <span>Proses Data</span>
                                <ArrowRight size={20}/>
                            </button>
                        </form>
                    </div>
                )}

            </div>

            {/* FOOTER */}
            <div className="p-6 bg-black z-20 text-center border-t border-white/10">
                {!isManualInput ? (
                    <p className="text-[10px] text-slate-500">
                        Kamera bermasalah? <button className="text-emerald-500 underline ml-1 font-bold" onClick={() => setIsManualInput(true)}>Input ID Manual</button>
                    </p>
                ) : (
                    <p className="text-[10px] text-slate-500">
                        Ingin scan ulang? <button className="text-emerald-500 underline ml-1 font-bold" onClick={() => setIsManualInput(false)}>Buka Kamera</button>
                    </p>
                )}
            </div>

            <style>{`
                @keyframes scan-laser { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                .animate-scan-laser { animation: scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                #qr-reader-stream video { object-fit: cover; width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
};

export default QRScannerModal;