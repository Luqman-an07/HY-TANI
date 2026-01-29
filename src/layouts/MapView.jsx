import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Sprout, AlertTriangle, ChevronRight, DownloadCloud, 
  MapPin, ShieldCheck, Maximize2, Globe, Layers, Move, Check, X, MousePointerClick
} from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- UTILITY ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'numeric', year: 'numeric'
    });
  }
  return dateStr; 
};

// --- COMPONENT: DRAGGABLE MARKER ---
const DraggableMarker = ({ farm, onSelect, onDragEndRequest, isRepositioning, tempPosition }) => {
    const markerRef = useRef(null);

    useEffect(() => {
        const marker = markerRef.current;
        if (marker) {
            if (isRepositioning) {
                marker.dragging.enable();
                marker.closePopup(); 
            } else {
                marker.dragging.disable();
            }
        }
    }, [isRepositioning]);

    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const { lat, lng } = marker.getLatLng();
                onDragEndRequest(farm.id, lat, lng);
            }
        },
    }), [farm, onDragEndRequest]);

    const displayPos = (isRepositioning && tempPosition) 
        ? [tempPosition.lat, tempPosition.lng] 
        : [farm.lat, farm.lng];

    return (
        <Marker
            draggable={isRepositioning} 
            eventHandlers={eventHandlers}
            position={displayPos}
            ref={markerRef}
            opacity={isRepositioning ? 0.8 : 1}
            zIndexOffset={isRepositioning ? 1000 : 0} 
            autoPan={true} 
        >
            {!isRepositioning && (
                <Popup>
                    <div className="text-center p-1 min-w-[160px]">
                        <h3 className="font-bold text-slate-800 text-sm">{farm.farmer}</h3>
                        <p className="text-xs text-slate-500 mb-1">{farm.name}</p>
                        <p className="text-[10px] bg-slate-100 rounded px-1 mb-2 font-mono">Luas: {farm.size} Ha</p>
                        <div className="flex flex-col space-y-2 mt-2">
                             <button 
                                onClick={() => onSelect(farm)}
                                className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors active:scale-95"
                            >
                                Buka Analisis Lahan
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    onDragEndRequest('START_EDIT', farm.id); 
                                }}
                                className="w-full bg-amber-50 text-amber-700 border border-amber-200 text-xs py-2 rounded-lg font-bold hover:bg-amber-100 transition-colors flex items-center justify-center active:scale-95"
                            >
                                <Move size={12} className="mr-1"/> Sesuaikan Posisi
                            </button>
                        </div>
                    </div>
                </Popup>
            )}
            
            {isRepositioning && (
                <Tooltip permanent direction="top" offset={[0, -36]} className="font-bold text-xs bg-amber-100 text-amber-800 border-amber-300 shadow-md">
                    Geser & Lepas Pin
                </Tooltip>
            )}
        </Marker>
    );
};

// --- MAP CONTROLS ---
const ResetViewControl = ({ center, zoom }) => {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-left">
      <div className="leaflet-control leaflet-bar">
        <button 
          className="bg-white p-2 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center shadow-md border border-slate-300 rounded-lg"
          onClick={() => map.setView(center, zoom)}
          title="Reset ke Peta Indonesia"
        >
          <Globe size={16} className="mr-1 text-emerald-600"/> <span className="hidden sm:inline">INDONESIA</span>
        </button>
      </div>
    </div>
  );
};

const RecenterAutomatically = ({ farms, user }) => {
  const map = useMap();
  useEffect(() => {
    if (farms.length > 0) {
      const lats = farms.map(f => f.lat);
      const lngs = farms.map(f => f.lng);
      if (lats.length && lngs.length) {
          const bounds = [
            [Math.min(...lats) - 0.005, Math.min(...lngs) - 0.005],
            [Math.max(...lats) + 0.005, Math.max(...lngs) + 0.005]
          ];
          map.fitBounds(bounds);
      }
    } 
    else if (user?.villageData?.lat && user?.villageData?.lng) {
      map.setView([user.villageData.lat, user.villageData.lng], 15);
    }
  }, [farms, map, user]);
  return null;
};

// --- MAIN COMPONENT ---
const MapView = ({ farms, isOffline, onSelectFarm, user, onUpdateLocation, onDownloadReport }) => {
  
  const [repositioningId, setRepositioningId] = useState(null); 
  const [tempPos, setTempPos] = useState(null); 

  const handleDragRequest = (idOrAction, latOrId, lng) => {
    if (idOrAction === 'START_EDIT') {
       setRepositioningId(latOrId); 
       const currentFarm = farms.find(f => f.id === latOrId);
       if (currentFarm) {
           setTempPos({ lat: parseFloat(currentFarm.lat), lng: parseFloat(currentFarm.lng) });
       }
    } else {
       setTempPos({ lat: latOrId, lng: lng });
    }
  };

  const saveLocation = () => {
    if (repositioningId && tempPos) {
        const farm = farms.find(f => f.id === repositioningId);
        if (!farm) return;

        const deltaLat = tempPos.lat - parseFloat(farm.lat);
        const deltaLng = tempPos.lng - parseFloat(farm.lng);

        let newPolygonData = null;
        if (farm.polygon && farm.polygon.length > 0) {
            newPolygonData = farm.polygon.map(pt => {
                const ptLat = (pt.lat !== undefined) ? pt.lat : (Array.isArray(pt) ? pt[0] : 0);
                const ptLng = (pt.lng !== undefined) ? pt.lng : (Array.isArray(pt) ? pt[1] : 0);
                return [parseFloat(ptLat) + deltaLat, parseFloat(ptLng) + deltaLng];
            });
        }
        onUpdateLocation(repositioningId, tempPos.lat, tempPos.lng, newPolygonData);
    }
    setRepositioningId(null);
    setTempPos(null);
  };

  const cancelLocation = () => {
    setRepositioningId(null);
    setTempPos(null);
  };

  const getPolygonPositions = (farm) => {
    const originalLat = parseFloat(farm.lat);
    const originalLng = parseFloat(farm.lng);
    
    const isEditing = repositioningId === farm.id && tempPos;
    const currentLat = isEditing ? tempPos.lat : originalLat;
    const currentLng = isEditing ? tempPos.lng : originalLng;

    const deltaLat = currentLat - originalLat;
    const deltaLng = currentLng - originalLng;

    if (farm.polygon && farm.polygon.length > 0) {
        return farm.polygon.map(pt => {
            const ptLat = (pt.lat !== undefined) ? pt.lat : (Array.isArray(pt) ? pt[0] : 0);
            const ptLng = (pt.lng !== undefined) ? pt.lng : (Array.isArray(pt) ? pt[1] : 0);
            return [parseFloat(ptLat) + deltaLat, parseFloat(ptLng) + deltaLng];
        });
    }
    
    // Fallback Box (Jika belum ada gambar)
    const sizeString = farm.size || "1"; 
    const sizeMatch = String(sizeString).match(/[\d,.]+/);
    let areaHa = sizeMatch ? parseFloat(sizeMatch[0].replace(',', '.')) : 1;
    if (isNaN(areaHa)) areaHa = 1;
    const sideMeters = Math.sqrt(areaHa * 10000);
    const offset = (sideMeters / 2) / 111320; 

    return [
      [currentLat + offset, currentLng - offset], 
      [currentLat + offset, currentLng + offset], 
      [currentLat - offset, currentLng + offset], 
      [currentLat - offset, currentLng - offset] 
    ];
  };

  const getColor = (status) => {
    switch(status) {
      case 'sehat': return '#10b981'; 
      case 'waspada': return '#f59e0b'; 
      case 'bahaya': return '#ef4444'; 
      default: return '#64748b';
    }
  };

  const vData = user?.villageData;
  const villageName = vData?.villageName || "Peta Wilayah Indonesia";
  const indonesiaCenter = [-2.5489, 118.0149]; 
  const indonesiaZoom = 5; 

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-20 space-y-4 md:space-y-6 relative px-4 md:px-0">
      
      {/* === FLOATING EDIT BAR (RESPONSIVE) === */}
      {repositioningId && (
          <div className="fixed top-20 md:top-24 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] md:w-auto bg-white px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-2xl border-2 border-amber-400 animate-in slide-in-from-top-4 flex items-center justify-between md:justify-start space-x-3 md:space-x-4">
              <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-full text-amber-600 animate-pulse shrink-0">
                      <MousePointerClick size={20} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wide">Mode Edit</span>
                      <span className="text-xs md:text-sm font-bold text-slate-800">Geser & Lepas Pin</span>
                  </div>
              </div>
              
              <div className="flex items-center space-x-2">
                  <button 
                    onClick={cancelLocation}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Batal"
                  >
                      <X size={20} />
                  </button>
                  <button 
                    onClick={saveLocation}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center ${!tempPos ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                    disabled={!tempPos} 
                  >
                      <Check size={16} className="mr-1"/> <span className="hidden sm:inline">Simpan</span>
                  </button>
              </div>
          </div>
      )}

      {/* === HEADER (STACK ON MOBILE) === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
             <h2 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">{villageName}</h2>
             {vData?.is3T && (
               <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
                 <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 flex items-center animate-pulse shadow-sm">
                   <ShieldCheck size={12} className="mr-1" /> 3T
                 </span>
                 <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 shadow-sm flex items-center">
                   ✨ Subsidi Aktif
                 </span>
               </div>
             )}
          </div>

          <div className="text-sm text-slate-500 flex flex-col sm:flex-row sm:items-center mb-2">
            <span className="flex items-center flex-wrap gap-1">
                <MapPin size={14} className="mr-1 text-slate-400" /> 
                {vData ? (
                    <>
                        Kec. <span className="font-bold text-slate-700">{vData.subDistrict}</span>
                        <span className="hidden sm:inline mx-1 text-slate-300">•</span>
                        Kab. <span className="font-bold text-slate-700">{vData.regency}</span>
                    </>
                ) : (
                    "Lokasi belum disetup"
                )}
            </span>
          </div>

          <p className="text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-100 flex items-center font-medium">
            <Layers size={12} className="mr-1.5" /> 
            Sistem Ketahanan Pangan
          </p>
        </div>

        <button 
            onClick={onDownloadReport} 
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
            <DownloadCloud size={18} /><span>Unduh Laporan</span>
        </button>
      </div>

      {/* === MAP CONTAINER (ADAPTIVE HEIGHT) === */}
      {/* Mobile: 400px, Desktop: 550px */}
      <div className="relative w-full h-[400px] md:h-[550px] bg-slate-100 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border-4 border-white z-0">
        <MapContainer 
            center={indonesiaCenter} 
            zoom={indonesiaZoom} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} // Disable default, we use custom or gesture
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Satelit (Esri)">
                    <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Peta Jalan (OSM)">
                    <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>
            </LayersControl>

            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" opacity={0.6} />

            <RecenterAutomatically farms={farms} user={user} />
            <ResetViewControl center={indonesiaCenter} zoom={indonesiaZoom} />

            {farms.map((farm) => (
                <React.Fragment key={farm.id}>
                    <Polygon 
                        positions={getPolygonPositions(farm)}
                        pathOptions={{ 
                            color: getColor(farm.status), 
                            fillColor: getColor(farm.status), 
                            fillOpacity: 0.5, 
                            weight: 2,
                            dashArray: farm.status === 'sehat' ? null : '5, 5'
                        }}
                        eventHandlers={{ 
                            click: () => {
                                if (!repositioningId) onSelectFarm(farm);
                            } 
                        }}
                    >
                         {!repositioningId && <Tooltip sticky direction="center" opacity={1} className="font-bold text-xs uppercase">{farm.name} - {farm.size} Ha</Tooltip>}
                    </Polygon>
                    <DraggableMarker farm={farm} onSelect={onSelectFarm} onDragEndRequest={handleDragRequest} isRepositioning={repositioningId === farm.id} tempPosition={tempPos} />
                </React.Fragment>
            ))}
        </MapContainer>
        
        {/* Legend (Hidden on very small screens if needed) */}
        {!repositioningId && (
            <div className="absolute top-4 right-4 md:top-20 md:right-2 z-[400] bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Indikator NDVI</p>
                <div className="space-y-1.5">
                    <div className="flex items-center text-xs font-medium text-slate-700"><div className="w-3 h-3 bg-emerald-500 rounded mr-2 border border-emerald-600"></div>Optimal</div>
                    <div className="flex items-center text-xs font-medium text-slate-700"><div className="w-3 h-3 bg-amber-500 rounded mr-2 border border-amber-600"></div>Waspada</div>
                    <div className="flex items-center text-xs font-medium text-slate-700"><div className="w-3 h-3 bg-red-500 rounded mr-2 border border-red-600"></div>Bahaya</div>
                </div>
            </div>
        )}
      </div>

      {/* === GRID KARTU === */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center px-2 md:px-0">
             <Maximize2 size={20} className="mr-2 text-slate-400" /> Detail Blok Lahan
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {farms.map((farm) => (
            <div 
                key={farm.id} 
                onClick={() => onSelectFarm(farm)} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col active:scale-[0.98] transform"
            >
                {/* Visual Header */}
                <div className={`h-28 relative overflow-hidden flex items-center justify-center transition-colors duration-300 ${farm.status === 'sehat' ? 'bg-emerald-50' : farm.status === 'waspada' ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px'}}></div>
                    
                    <Sprout className={`w-12 h-12 transition-transform duration-500 group-hover:scale-110 ${farm.status === 'sehat' ? 'text-emerald-500' : farm.status === 'waspada' ? 'text-amber-500' : 'text-red-500'}`} />
                    
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-slate-100 flex items-center">
                        <span className="text-slate-400 mr-1">NDVI</span>
                        <span className={`font-mono ${farm.status === 'sehat' ? 'text-emerald-600' : 'text-slate-800'}`}>{farm.ndvi}</span>
                    </div>

                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${farm.status === 'sehat' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : farm.status === 'waspada' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {farm.status}
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors truncate">{farm.name}</h3>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                            <MapPin size={12} className="mr-1" /> {farm.farmer}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Luas</p>
                            <p className="text-sm font-bold text-slate-700">{farm.size} Ha</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Est. Panen</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{farm.prediction}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                         <span className="text-slate-400 font-medium">Next Visit:</span>
                         <span className={`font-bold px-2 py-0.5 rounded ${farm.status === 'bahaya' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {formatDate(farm.nextVisit)}
                         </span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;