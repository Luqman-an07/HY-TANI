import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanLine, Zap, ZapOff, Camera, AlertCircle, Keyboard, ArrowRight, ChevronLeft, QrCode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    const [scanError, setScanError] = useState(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    
    // State Input Manual
    const [isManualInput, setIsManualInput] = useState(false);
    const [manualId, setManualId] = useState('');
    
    const scannerRef = useRef(null);

    // --- 1. LOGIKA UTAMA SCANNER (KAMERA) ---
    useEffect(() => {
        const cleanupScanner = async () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (err) {
                    console.warn("Cleanup warning:", err);
                }
                scannerRef.current = null;
            }
        };

        const startScanner = async () => {
            setScanError(null);

            if (isOpen && !isManualInput) {
                // Delay sedikit agar DOM render sempurna
                await new Promise(r => setTimeout(r, 100));

                const elementId = "qr-reader-stream";
                if(!document.getElementById(elementId)) return;

                await cleanupScanner();

                try {
                    const html5QrCode = new Html5Qrcode(elementId);
                    scannerRef.current = html5QrCode;

                    // Config Parameter 1 (Hanya facingMode)
                    const cameraConfig = { facingMode: "environment" }; 

                    // Config Parameter 2 (Settings)
                    const qrConfig = { 
                        fps: 15, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                    };

                    await html5QrCode.start(
                        cameraConfig, 
                        qrConfig,
                        (decodedText) => handleSuccess(decodedText, html5QrCode),
                        (errorMessage) => { /* ignore */ }
                    );
                } catch (err) {
                    console.error("Camera Start Error:", err);
                    setScanError("Gagal akses kamera. Pastikan izin diberikan.");
                }
            } else {
                cleanupScanner();
            }
        };

        startScanner();

        return () => {
            cleanupScanner();
        };
    }, [isOpen, isManualInput]);

    const handleSuccess = (decodedText, instance) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
        
        onScanSuccess(decodedText);
        
        if (instance) {
            instance.stop().then(() => { instance.clear(); onClose(); }).catch(() => onClose());
        } else {
            onClose();
        }
    };

    // --- 2. FIX UX: HANDLER SUBMIT MANUAL (KEYBOARD FRIENDLY) ---
    const handleManualSubmit = (e) => {
        e.preventDefault(); // Mencegah reload halaman
        
        if (manualId.trim()) {
            // Paksa Keyboard Turun (Blur)
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            // Gunakan timeout super singkat agar UI tidak glitch saat keyboard turun
            setTimeout(() => {
                handleSuccess(manualId, null);
                setManualId('');
            }, 50); 
        }
    };

    // --- 3. FIX UX: HANDLER PINDAH MODE (KEYBOARD FRIENDLY) ---
    const handleSwitchToCamera = () => {
        // Paksa keyboard turun dulu sebelum ganti state
        // Ini mencegah tombol harus diklik 2x
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setIsManualInput(false);
    };

    const toggleFlash = () => {
        if (scannerRef.current) {
            scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !isFlashOn }] })
            .then(() => setIsFlashOn(!isFlashOn))
            .catch(() => alert("Flash tidak didukung di perangkat ini."));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in fade-in duration-300">
            
            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/90 to-transparent">
                {!isManualInput ? (
                    <button type="button" onClick={toggleFlash} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                        {isFlashOn ? <Zap size={20} className="text-yellow-400 fill-yellow-400"/> : <ZapOff size={20} className="text-slate-300"/>}
                    </button>
                ) : (
                    // Tombol Back di Header juga pakai handler aman
                    <button type="button" onClick={handleSwitchToCamera} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-slate-300 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                )}
                
                <h3 className="font-bold text-lg tracking-wide flex items-center">
                    {isManualInput ? <Keyboard className="mr-2 text-emerald-400" size={20}/> : <ScanLine className="mr-2 text-emerald-400" size={20}/>}
                    {isManualInput ? 'Input ID' : 'Scan QR'}
                </h3>

                <button type="button" onClick={onClose} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-red-500/50 hover:border-red-500 transition-all">
                    <X size={20} className="text-white"/>
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative flex flex-col justify-center items-center overflow-hidden bg-black">
                
                {/* --- MODE KAMERA --- */}
                {!isManualInput && (
                    <div id="qr-reader-stream" className="w-full h-full object-cover"></div>
                )}

                {/* Overlay Kotak Scan */}
                {!isManualInput && !scanError && (
                    <>
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
                        <div className="absolute bottom-32 z-20 text-center px-6 pointer-events-none">
                            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2 animate-pulse">Mencari Kode...</p>
                            <p className="text-slate-300 text-xs max-w-xs mx-auto leading-relaxed">Arahkan kamera ke QR Code lahan.</p>
                        </div>
                    </>
                )}

                {/* Error State */}
                {!isManualInput && scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30 px-6 text-center">
                        <AlertCircle className="text-red-500 w-12 h-12 mb-4"/>
                        <p className="text-white font-bold mb-2">{scanError}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg text-sm">Tutup</button>
                    </div>
                )}

                {/* --- MODE INPUT MANUAL --- */}
                {isManualInput && (
                    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col justify-center items-center p-6 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="w-full max-w-sm md:max-w-md bg-transparent md:bg-slate-900/50 md:p-8 md:rounded-3xl md:border border-slate-800">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-xl">
                                    <Keyboard size={32} className="text-emerald-500"/>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Input Manual</h3>
                                <p className="text-slate-400 text-sm">Masukkan Nomor ID Lahan yang tertera pada dokumen atau kartu fisik.</p>
                            </div>

                            <form onSubmit={handleManualSubmit} className="flex flex-col gap-5 w-full">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-500 font-mono text-lg">#</span>
                                    </div>
                                    {/* Input Field dengan enterKeyHint="go" untuk tombol keyboard HP */}
                                    <input 
                                        type="number" 
                                        inputMode="numeric"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        placeholder="Contoh: 173820..."
                                        enterKeyHint="go" 
                                        className="w-full bg-slate-900 border-2 border-slate-700 text-white text-lg font-mono font-bold py-4 pl-10 pr-4 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700 shadow-inner"
                                        autoFocus
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={!manualId.trim()}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30 border border-emerald-500/50"
                                >
                                    <span>Cari Data Lahan</span>
                                    <ArrowRight size={20}/>
                                </button>
                            </form>

                            {/* Tombol Pindah ke Kamera (Menggunakan Handler Aman) */}
                            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                                <p className="text-slate-500 text-xs mb-3">Ingin menggunakan kamera?</p>
                                <button 
                                    type="button" 
                                    onClick={handleSwitchToCamera}
                                    className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-bold"
                                >
                                    <QrCode size={18} />
                                    <span>Scan Barcode</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* FOOTER (Hanya Mode Kamera) */}
            {!isManualInput && (
                <div className="p-6 bg-black z-20 text-center border-t border-white/10 pb-10 md:pb-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Opsi Lain</p>
                    <button 
                        type="button" 
                        className="text-sm font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 px-6 py-3 rounded-full transition-colors border border-slate-700 w-full md:w-auto" 
                        onClick={() => setIsManualInput(true)}
                    >
                        Input ID Secara Manual
                    </button>
                </div>
            )}

            <style>{`
                @keyframes scan-laser { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                .animate-scan-laser { animation: scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                #qr-reader-stream video { object-fit: cover; width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
};

export default QRScannerModal;