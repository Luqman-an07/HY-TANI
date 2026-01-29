import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Save, User, MapPin, Ruler, Phone, 
  Sprout, Timer, Leaf, Droplets, Bug, 
  Trash2, Navigation, MousePointerClick, Check, Undo2, PlayCircle,
  Info, AlertTriangle, Clock, Calendar, AlertCircle, Crosshair,
  TrendingUp, Activity, ChevronDown
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import area from '@turf/area';
import centroid from '@turf/centroid';
import { polygon as turfPolygon } from '@turf/helpers';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Icon Setup
const vertexIcon = L.divIcon({ className: 'bg-white border-2 border-emerald-600 rounded-full', iconSize: [10, 10], iconAnchor: [5, 5] });
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENT: ACCORDION ITEM ---
const FormSection = ({ title, icon: Icon, isOpen, onClick, children }) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-100'}`}>
            <button 
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer outline-none touch-manipulation"
            >
                <div className="flex items-center">
                    <div className={`p-1.5 rounded-lg mr-3 ${isOpen ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <Icon size={16} className={isOpen ? 'text-emerald-600' : 'text-slate-400'} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${isOpen ? 'text-emerald-800' : 'text-slate-500'}`}>
                        {title}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 border-t border-slate-50 bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- DRAWING CONTROLLER ---
const DrawingController = ({ isDrawing, onAddPoint }) => {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                L.DomEvent.stopPropagation(e.originalEvent);
                onAddPoint(e.latlng);
            }
        },
    });
    return null;
};

const AddDataModal = ({ isOpen, onClose, onSave, initialData, userLocation }) => {
  // --- STATE ---
  const [formData, setFormData] = useState({
    farmer: '', contact: '', joinDate: '', name: '', size: '', age: '',
    plantingDate: '', harvestDate: '', nextVisit: '', lat: null, lng: null, polygon: [] 
  });
  const [parameters, setParameters] = useState({ water: '', fertilizer: '', pest: '' });
  const [calculation, setCalculation] = useState({ status: 'bahaya', score: 0, ndvi: 0, prediction: '0 Ton', value: 'Rp 0', failureRisk: 100 });
  const [scheduleType, setScheduleType] = useState('auto');
  const [autoScheduleReason, setAutoScheduleReason] = useState('');
  const [activeSection, setActiveSection] = useState('owner'); 
  const [mode, setMode] = useState('idle');
  const [tempPoints, setTempPoints] = useState([]); 
  const mapRef = useRef(null);

  const mapCenter = useMemo(() => {
      return userLocation?.lat ? [userLocation.lat, userLocation.lng] : [-2.5489, 118.0149];
  }, [userLocation]);

  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);

  const getStatusColor = (status) => {
      switch(status) {
          case 'sehat': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };
          case 'waspada': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
          case 'bahaya': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
          default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100' };
      }
  };
  const statusStyles = getStatusColor(calculation.status);

  // --- EFFECT ---
  useEffect(() => {
    if (initialData) {
      setFormData({
        farmer: initialData.farmer, contact: initialData.contact || '', joinDate: initialData.joinDate || new Date().toISOString().split('T')[0],
        name: initialData.name, size: initialData.size, age: initialData.age || '', plantingDate: initialData.plantingDate || '',
        harvestDate: initialData.harvestDate || '', nextVisit: initialData.nextVisit || '', lat: initialData.lat || null, lng: initialData.lng || null, polygon: initialData.polygon || [] 
      });
      if (initialData.polygon && initialData.polygon.length > 0) {
          setTempPoints(initialData.polygon); setMode('finished');
      } else {
          setMode('idle'); setTempPoints([]);
      }
      setParameters({ water: initialData.waterScore || '', fertilizer: initialData.fertScore || '', pest: initialData.pestScore || '' });
      setScheduleType('manual');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  useEffect(() => {
      if (isOpen && mapRef.current) {
          const target = initialData?.lat ? [initialData.lat, initialData.lng] : mapCenter;
          mapRef.current.invalidateSize();
          const timer = setTimeout(() => {
              if (mapRef.current) {
                  mapRef.current.invalidateSize();
                  mapRef.current.setView(target, 16);
              }
          }, 500); 
          return () => clearTimeout(timer);
      }
  }, [isOpen, initialData, mapCenter]);

  // --- ACTIONS ---
  const resetMapView = () => { if(mapRef.current) mapRef.current.flyTo(mapCenter, 16); };
  const startDrawing = () => { setMode('drawing'); setTempPoints([]); setFormData(prev => ({ ...prev, lat: null, lng: null, size: '', polygon: [] })); setActiveSection(null); };
  const addPoint = (latlng) => setTempPoints(prev => [...prev, [latlng.lat, latlng.lng]]);
  const undoPoint = () => setTempPoints(prev => prev.slice(0, -1));
  
  const finishDrawing = () => {
      if (tempPoints.length < 3) { alert("Minimal 3 titik!"); return; }
      try {
          const turfCoords = tempPoints.map(pt => [pt[1], pt[0]]); turfCoords.push(turfCoords[0]); 
          const poly = turfPolygon([turfCoords]); const areaM2 = area(poly); const center = centroid(poly);
          setFormData(prev => ({ ...prev, size: (areaM2 / 10000).toFixed(2), lat: center.geometry.coordinates[1], lng: center.geometry.coordinates[0], polygon: tempPoints }));
          setMode('finished'); setActiveSection('location');
      } catch (err) { alert("Gagal kalkulasi area."); }
  };
  const resetDrawing = () => { setTempPoints([]); setMode('idle'); setFormData(prev => ({ ...prev, size: '', lat: null, lng: null, polygon: [] })); };

  const handlePlantingDateChange = (e) => {
    const pDateVal = e.target.value;
    if (pDateVal) {
        const hDate = new Date(new Date(pDateVal)); hDate.setDate(hDate.getDate() + 105); 
        setFormData(prev => ({ ...prev, plantingDate: pDateVal, harvestDate: hDate.toISOString().split('T')[0] }));
    } else { setFormData(prev => ({ ...prev, plantingDate: pDateVal })); }
  };

  // --- CALCULATION ---
  useEffect(() => {
    if (scheduleType === 'auto') {
      const date = new Date(); let daysToAdd = 7; let reason = "";
      if (calculation.score === 0 || parameters.water === '') { daysToAdd = 1; reason = "Data belum lengkap."; } 
      else if (calculation.status === 'sehat') { daysToAdd = 7; reason = "Rutin mingguan (Sehat)."; } 
      else { daysToAdd = 3; reason = "Segera Cek (Masalah)."; }
      date.setDate(date.getDate() + daysToAdd); 
      setFormData(prev => ({ ...prev, nextVisit: date.toISOString().split('T')[0] }));
      setAutoScheduleReason(reason);
    }
  }, [scheduleType, calculation.status, calculation.score, parameters]); 

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ farmer: '', contact: '', joinDate: today, name: '', size: '', age: '', plantingDate: '', harvestDate: '', nextVisit: '', lat: null, lng: null, polygon: [] });
    setParameters({ water: '', fertilizer: '', pest: '' });
    setScheduleType('auto'); setMode('idle'); setTempPoints([]); setActiveSection('owner');
  };

  useEffect(() => {
    const w = parameters.water === '' ? 0 : parseInt(parameters.water);
    const f = parameters.fertilizer === '' ? 0 : parseInt(parameters.fertilizer);
    const p = parameters.pest === '' ? 0 : parseInt(parameters.pest);
    const score = (w * 0.4) + (f * 0.3) + (p * 0.3);
    let status = 'sehat';
    if (score < 50) status = 'bahaya'; else if (score < 80) status = 'waspada';
    const landSize = parseFloat(String(formData.size).replace(',', '.') || 0);
    const estYield = landSize * 6 * (score / 100);
    const estVal = (estYield * 6000000) / 1000000; 
    const ndvi = (0.1 + (score / 100) * 0.75).toFixed(2);
    setCalculation({ status, score: score.toFixed(0), ndvi, prediction: `${estYield.toFixed(1)} Ton`, value: `Rp ${estVal.toFixed(1)} Juta`, failureRisk: (100 - score).toFixed(0) });
  }, [parameters, formData.size]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.polygon.length) { alert("Wajib gambar lokasi lahan!"); return; }
    onSave({ ...formData, ...initialData, ...calculation, waterScore: parameters.water, pestScore: parameters.pest, fertScore: parameters.fertilizer });
  };

  if (!isOpen) return null;

  return (
    // PERBAIKAN: Z-INDEX 9999
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      
      {/* MODAL: Responsive Flex Layout */}
      <div className="bg-white w-full max-w-7xl h-[100dvh] md:h-[95vh] rounded-none md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-700">
        
        {/* === KOLOM 1: PETA (ATAS DI MOBILE, KIRI DI DESKTOP) === */}
        <div className="w-full md:w-[60%] h-[35vh] min-h-[300px] md:h-full relative bg-slate-100 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 order-1 shrink-0">
            {/* Header Peta */}
            <div className="bg-white px-3 py-2 md:px-4 md:py-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-10 shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden">
                    {mode === 'idle' && <div className="flex items-center text-slate-500 text-xs md:text-sm truncate"><Navigation size={16} className="mr-1 md:mr-2 text-blue-600"/> <span className="truncate">Navigasi Peta</span></div>}
                    {mode === 'drawing' && <div className="flex items-center text-emerald-600 text-xs md:text-sm font-bold animate-pulse truncate"><MousePointerClick size={16} className="mr-1 md:mr-2"/> <span className="truncate">Menggambar ({tempPoints.length})</span></div>}
                    {mode === 'finished' && <div className="flex items-center text-emerald-700 text-xs md:text-sm font-bold truncate"><Check size={16} className="mr-1 md:mr-2"/> <span className="truncate">Selesai ({formData.size} Ha)</span></div>}
                </div>
                <div className="flex space-x-1 md:space-x-2 shrink-0">
                    {mode === 'idle' && <button onClick={startDrawing} className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-700 shadow-md whitespace-nowrap"><PlayCircle size={14} className="mr-1 md:mr-2"/> Gambar</button>}
                    {mode === 'drawing' && (
                        <>
                            <button onClick={undoPoint} disabled={tempPoints.length === 0} className="flex items-center px-2 py-1.5 md:px-3 md:py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] md:text-xs font-bold hover:bg-slate-200 disabled:opacity-50"><Undo2 size={14} className="mr-1"/> Undo</button>
                            <button onClick={finishDrawing} className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-emerald-600 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-emerald-700 shadow-md"><Check size={14} className="mr-1 md:mr-2"/> OK</button>
                        </>
                    )}
                    {(mode === 'drawing' || mode === 'finished') && <button onClick={resetDrawing} className="flex items-center px-2 py-1.5 md:px-3 md:py-2 bg-red-50 text-red-600 rounded-lg text-[10px] md:text-xs font-bold border border-red-100 hover:bg-red-100"><Trash2 size={14} className="mr-1"/> Batal</button>}
                </div>
            </div>
            {/* Map Canvas */}
            <div className="flex-1 relative z-0 cursor-crosshair h-full w-full">
                <MapContainer center={mapCenter} zoom={17} style={{ height: '100%', width: '100%' }} className="bg-slate-200" ref={mapRef} doubleClickZoom={false} zoomControl={false}> 
                    <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} />
                    <DrawingController isDrawing={mode === 'drawing'} onAddPoint={addPoint} />
                    {mode === 'drawing' && tempPoints.length > 0 && (<><Polyline positions={tempPoints} pathOptions={{ color: '#fbbf24', weight: 3, dashArray: '5, 10' }} />{tempPoints.map((pos, idx) => (<Marker key={idx} position={pos} icon={vertexIcon} />))}</>)}
                    {mode === 'finished' && formData.polygon.length > 0 && (<Polygon positions={formData.polygon} pathOptions={{ color: '#10b981', fillOpacity: 0.4, weight: 3 }} />)}
                    {formData.lat && <Marker position={[formData.lat, formData.lng]} />}
                </MapContainer>
                <button onClick={resetMapView} className="absolute bottom-4 right-4 z-[400] bg-white p-2 rounded-lg shadow-md text-slate-500 hover:text-blue-600" title="Reset View"><Crosshair size={20} /></button>
                {mode === 'drawing' && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/80 text-white px-3 py-1.5 rounded-full text-[10px] md:text-xs font-medium pointer-events-none backdrop-blur shadow-xl z-[400] whitespace-nowrap text-center w-[90%] md:w-auto">Ketuk peta untuk titik sudut.</div>}
            </div>
        </div>

        {/* === KOLOM 2: FORMULIR (BAWAH DI MOBILE, KANAN DI DESKTOP) === */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 md:border-l border-slate-200 shadow-xl z-20 order-2">
            
            {/* A. FORM HEADER (Fixed Top of Section) */}
            <div className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                <div><h2 className="text-base md:text-lg font-bold text-slate-800">Administrasi Lahan</h2><p className="text-[10px] md:text-xs text-slate-500">Isi field bertanda <span className="text-red-500">*</span></p></div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>

            {/* B. FORM BODY (SCROLLABLE AREA) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-slate-50">
                <form id="addFarmForm" onSubmit={handleSubmit} className="space-y-3 pb-4">
                    
                    {/* Accordion 1: Identitas */}
                    <FormSection title="Data Pemilik" icon={User} isOpen={activeSection === 'owner'} onClick={() => toggleSection('owner')}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                                    placeholder="Contoh: Bpk. Sutrisno" value={formData.farmer} onChange={e => setFormData({...formData, farmer: e.target.value})} />
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Usia <span className="text-red-500">*</span></label>
                                    <input required type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        placeholder="Thn" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">WhatsApp <span className="text-red-500">*</span></label>
                                    <input required type="tel" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        placeholder="08..." value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Accordion 2: Lokasi */}
                    <FormSection title="Data Lahan" icon={MapPin} isOpen={activeSection === 'location'} onClick={() => toggleSection('location')}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-emerald-600/80 mb-1">Nama Blok / Lokasi <span className="text-red-500">*</span></label>
                                <input required type="text" className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium placeholder:text-slate-400" 
                                    placeholder="Contoh: Blok Sawah Utara" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <span className="text-xs text-emerald-800 font-medium flex items-center"><Ruler size={14} className="mr-2"/> Luas Terhitung:</span>
                                <span className="text-sm font-black text-emerald-700">{formData.size || "0.0"} Ha</span>
                            </div>
                            {formData.size === "" && <p className="text-[10px] text-amber-600 italic">Silakan gambar lahan di peta terlebih dahulu.</p>}
                        </div>
                    </FormSection>

                    {/* Accordion 3: Jadwal */}
                    <FormSection title="Jadwal Tanam" icon={Timer} isOpen={activeSection === 'schedule'} onClick={() => toggleSection('schedule')}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Mulai Tanam <span className="text-red-500">*</span></label>
                                <input required type="date" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none" value={formData.plantingDate} onChange={handlePlantingDateChange} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Estimasi Panen <span className="text-red-500">*</span></label>
                                <input required type="date" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none" value={formData.harvestDate} onChange={e => setFormData({...formData, harvestDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-50">
                            <label className="block text-[10px] font-bold text-slate-400 mb-2">Rekomendasi Kunjungan</label>
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setScheduleType('auto')} className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors ${scheduleType === 'auto' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>OTOMATIS</button>
                                <button type="button" onClick={() => setScheduleType('manual')} className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors ${scheduleType === 'manual' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>MANUAL</button>
                            </div>
                            <input required type="date" disabled={scheduleType === 'auto'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold disabled:text-slate-500 disabled:bg-slate-100" value={formData.nextVisit} onChange={e => setFormData({...formData, nextVisit: e.target.value})} />
                            {scheduleType === 'auto' && <p className="text-[9px] text-amber-600 mt-1 flex items-center italic"><Info size={10} className="mr-1"/> {autoScheduleReason}</p>}
                        </div>
                    </FormSection>

                    {/* Accordion 4: Fisik */}
                    <FormSection title="Kondisi Fisik" icon={Leaf} isOpen={activeSection === 'physical'} onClick={() => toggleSection('physical')}>
                        <div className="space-y-3">
                            <div className="relative">
                                <label className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] font-bold text-blue-500">Sumber Air <span className="text-red-500">*</span></label>
                                <select required className="w-full px-3 py-2.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none" value={parameters.water} onChange={(e) => setParameters({...parameters, water: e.target.value})}>
                                    <option value="" disabled>Pilih Kondisi...</option><option value="100">🌊 Melimpah / Irigasi Lancar</option><option value="80">💧 Cukup (Tadah Hujan)</option><option value="50">⚠️ Kurang / Terbatas</option><option value="20">🔥 Kering / Kemarau</option>
                                </select>
                            </div>
                            <div className="relative pt-1">
                                <label className="absolute top-0 left-2 bg-white px-1 text-[9px] font-bold text-emerald-500">Tanaman <span className="text-red-500">*</span></label>
                                <select required className="w-full px-3 py-2.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none" value={parameters.fertilizer} onChange={(e) => setParameters({...parameters, fertilizer: e.target.value})}>
                                    <option value="" disabled>Pilih Kondisi...</option><option value="100">🌿 Subur / Rutin Pupuk</option><option value="70">🌱 Standar</option><option value="40">🍂 Kurang Nutrisi / Kuning</option>
                                </select>
                            </div>
                            <div className="relative pt-1">
                                <label className="absolute top-0 left-2 bg-white px-1 text-[9px] font-bold text-red-500">Hama <span className="text-red-500">*</span></label>
                                <select required className="w-full px-3 py-2.5 text-xs bg-white border border-red-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-red-400 outline-none" value={parameters.pest} onChange={(e) => setParameters({...parameters, pest: e.target.value})}>
                                    <option value="" disabled>Pilih Kondisi...</option><option value="100">🛡️ Nihil / Sehat</option><option value="70">🦗 Ada Sedikit</option><option value="40">⚠️ Serangan Sedang</option><option value="10">☠️ Puso / Gagal Panen</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Summary Dashboard */}
                    <div className={`rounded-xl p-4 border-2 transition-colors ${statusStyles.bg} ${statusStyles.border}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Skor Kelayakan</span>
                                <div className="flex items-baseline">
                                    <span className="text-3xl md:text-4xl font-black text-slate-800">{calculation.score}</span>
                                    <span className="text-xs md:text-sm font-bold text-slate-400 ml-1">/100</span>
                                </div>
                            </div>
                            <div className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wide border border-current ${statusStyles.badge}`}>
                                {calculation.status}
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                <span className="text-slate-500 flex items-center"><AlertCircle size={10} className="mr-1"/> Resiko Gagal</span>
                                <span className={`${parseInt(calculation.failureRisk) > 50 ? 'text-red-600' : 'text-emerald-600'}`}>{calculation.failureRisk}%</span>
                            </div>
                            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
                                <div className={`h-full transition-all duration-500 ${parseInt(calculation.failureRisk) > 50 ? 'bg-red-500' : parseInt(calculation.failureRisk) > 20 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{width: `${calculation.failureRisk}%`}}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Prediksi Panen</span>
                                <span className="text-xs md:text-sm font-bold text-slate-700 flex items-center"><TrendingUp size={12} className="mr-1 text-emerald-500"/> {calculation.prediction}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Estimasi Nilai</span>
                                <span className="text-xs md:text-sm font-bold text-slate-700 flex items-center"><Activity size={12} className="mr-1 text-amber-500"/> {calculation.value}</span>
                            </div>
                        </div>
                    </div>

                </form>
            </div>

            {/* C. FORM FOOTER (Fixed Bottom - Selalu Terlihat) */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end space-x-3 shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 text-xs tracking-wide transition-colors">BATAL</button>
                <button type="submit" form="addFarmForm" className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-transform active:scale-95 text-xs flex items-center justify-center tracking-wide">
                    <Save size={16} className="mr-2" /> SIMPAN DATA
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AddDataModal;