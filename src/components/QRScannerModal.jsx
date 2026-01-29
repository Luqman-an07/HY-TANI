import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    onScanSuccess(decodedText); // Send ID back to App
                    onClose();
                }, 
                (error) => {
                    console.warn(error);
                }
            );

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-slate-800 p-2 rounded-full">
                <X size={24} />
            </button>
            
            <div className="bg-white p-4 rounded-2xl w-full max-w-sm">
                <h3 className="text-center font-bold mb-4 flex items-center justify-center gap-2">
                    <Camera className="text-emerald-600"/> Scan Kartu Tani
                </h3>
                <div id="reader" className="overflow-hidden rounded-xl"></div>
                <p className="text-xs text-center text-slate-500 mt-4">Arahkan kamera ke QR Code Digital Pass</p>
            </div>
        </div>
    );
};

export default QRScannerModal;