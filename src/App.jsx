import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, CloudOff, Loader2, RefreshCw, SignalLow } from 'lucide-react';
import { supabase } from './lib/supabaseClient'; 
import { registerPolygonToSatellite, getSatelliteNDVI } from './lib/satelliteApi';
import { addToQueue, processOfflineQueue, getQueue } from './lib/offlineSync';
import { generatePDFReport } from './lib/reportGenerator'; 

// Imports Data
import { generatePlots, initialFarms } from './data/mockData'; 

// Imports Layout Wrapper
import MainLayout from './layouts/MainLayout';

// Imports Components
import AuthScreen from './components/AuthScreen';
import AddDataModal from './components/AddDataModal';
import SetupProfileModal from './components/SetupProfileModal';
import EmptyState from './components/EmptyState';
import DeleteModal from './components/DeleteModal';
import CompleteVisitModal from './components/CompleteVisitModal';
import FarmerDetailModal from './components/FarmerDetailModal'; 
import ConfirmationModal from './components/ConfirmationModal';
import CheckInModal from './components/CheckInModal';

// Imports Page Content
import MapView from './layouts/MapView';
import DataView from './layouts/DataView';
import FarmerView from './layouts/FarmerView';
import FarmerDetailFull from './layouts/FarmerDetailFull'; 
import ProfileView from './layouts/ProfileView';

const App = () => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('peta');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [notification, setNotification] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isUnstable, setIsUnstable] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  
  const [farms, setFarms] = useState(() => {
    const savedData = localStorage.getItem('hytani_data');
    return savedData ? JSON.parse(savedData) : []; 
  });

  const [selectedFarm, setSelectedFarm] = useState(null); 
  const [viewingFarm, setViewingFarm] = useState(null);   
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null); 
  const [completingFarm, setCompletingFarm] = useState(null);
  const [farmToDelete, setFarmToDelete] = useState(null); 
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]); 
  const [showSimModal, setShowSimModal] = useState(false);
  const [checkInFarm, setCheckInFarm] = useState(null); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        fetchFarms();
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        fetchFarms();
      } else {
        setUserProfile(null);
        setFarms([]);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('hytani_data', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    const handleOnline = () => {
        setIsOffline(false);
        showNotification("Koneksi Kembali! Memproses antrian...");
        handleManualSync();
    };

    const handleOffline = () => {
        setIsOffline(true);
        setIsUnstable(false); 
        showNotification("Mode Offline Aktif.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const qualityInterval = setInterval(async () => {
        if (isOffline) return; 
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                setIsUnstable(true);
                return;
            }
        }
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal: AbortSignal.timeout(3000) });
            setIsUnstable(false); 
        } catch (error) {
            setIsUnstable(true);
        }
    }, 15000);

    const queueInterval = setInterval(() => {
        const queue = getQueue();
        setOfflineQueueCount(queue.length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
      clearInterval(qualityInterval);
    };
  }, [isOffline]);

  const fetchUserProfile = async (userId) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) setUserProfile({ ...data, villageData: data.village_data });
    } catch (e) {
        console.log("Offline: Gagal fetch profil");
    }
  };

  // ==========================================
  // PERUBAHAN 1: MENGAMBIL DATA DARI 2 TABEL
  // ==========================================
  const fetchFarms = async () => {
    if (!navigator.onLine) return; 
    setIsDataLoading(true);
    try {
      // 1. Ambil Data Induk Lahan
      const { data: farmsData, error: farmsError } = await supabase.from('farms').select('*').order('created_at', { ascending: false });
      if (farmsError) throw farmsError;

      // 2. Ambil Data Riwayat Kunjungan
      const { data: logsData, error: logsError } = await supabase.from('visit_logs').select('*').order('visited_at', { ascending: false });
      const logs = logsData || [];

      // 3. Gabungkan Data (Mapping)
      const mappedData = farmsData.map(f => {
        // Filter log kunjungan khusus untuk lahan ini
        const farmLogs = logs.filter(log => log.farm_id === f.id);

        return {
          id: f.id,
          farmer: f.farmer_name,
          contact: f.contact,
          age: f.age,
          joinDate: f.join_date,
          name: f.farm_name,
          size: f.size_ha ? f.size_ha.toString() : "0",
          lat: f.lat,
          lng: f.lng,
          plantingDate: f.planting_date,
          harvestDate: f.harvest_date,
          nextVisit: f.next_visit,
          visitHistory: farmLogs, // <--- Memasukkan array dari tabel visit_logs
          status: f.status,
          ndvi: f.ndvi ? f.ndvi.toString() : "0",
          satelliteDate: f.satellite_date,
          prediction: f.prediction,
          value: f.est_value,
          waterScore: f.water_score,
          fertScore: f.fert_score,
          pestScore: f.pest_score,
          plots: generatePlots(f.status),
          lastUpdate: new Date(f.created_at).toLocaleDateString('id-ID'),
          polygon: f.polygon_data || [], 
          external_polygon_id: f.external_polygon_id
        };
      });
      
      setFarms(mappedData);
      
      if (selectedFarm) {
          const updatedSelected = mappedData.find(m => m.id === selectedFarm.id);
          if (updatedSelected) setSelectedFarm(updatedSelected);
      }
    } catch (error) { console.log("Fetch skipped", error); } 
    finally { setIsDataLoading(false); }
  };

  // ... (Fungsi sync, scan, form submit, delete, dll tetap sama) ...
  const handleManualSync = async () => {
      if (!navigator.onLine) {
          showNotification("Tidak ada koneksi internet.");
          return;
      }
      setIsSyncing(true);
      const processed = await processOfflineQueue();
      if (processed > 0) {
          showNotification(`${processed} data offline berhasil disinkronkan!`);
          await fetchFarms();
      }
      const queue = getQueue();
      setOfflineQueueCount(queue.length);
      setIsSyncing(false);
  };

  const handleGlobalScan = (scannedId) => {
      const foundFarm = farms.find(f => f.id.toString() === scannedId);
      if (foundFarm) {
          setCheckInFarm(foundFarm); 
          showNotification(`Lokasi Terdeteksi: ${foundFarm.farmer}`);
      } else {
          showNotification("Data QR Code tidak ditemukan di database ini.");
      }
  };

  const executeCheckIn = async (farmId) => {
      if (!navigator.onLine) {
          showNotification("Check-in butuh koneksi internet (Fitur Offline segera hadir)."); 
          setCheckInFarm(null);
          return;
      }
      try {
          const { data, error } = await supabase.rpc('process_checkin', { target_farm_id: farmId });
          if (error) throw error;
          showNotification(`✅ Check-In Berhasil!`);
          await fetchFarms(); 
      } catch (err) {
          console.error(err);
          showNotification("Gagal melakukan Check-In: " + err.message);
      } finally {
          setCheckInFarm(null);
      }
  };

  const handleFormSubmit = async (submittedData) => {
    if (!session) return;
    const villageLat = userProfile?.villageData?.lat || -6.2088;
    const villageLng = userProfile?.villageData?.lng || 106.8456;
    const randomOffset = () => (Math.random() - 0.5) * 0.003; 
    const finalLat = submittedData.lat || (villageLat + randomOffset());
    const finalLng = submittedData.lng || (villageLng + randomOffset());

    let satellitePolygonId = editingFarm ? editingFarm.external_polygon_id : null;
    let satelliteNDVI = parseFloat(submittedData.ndvi) || 0; 
    let satelliteDate = null; 

    const isActuallyOnline = navigator.onLine && !isOffline;

    if (isActuallyOnline && !editingFarm) {
        try {
            showNotification("Menghubungi Satelit...");
            satellitePolygonId = await registerPolygonToSatellite(submittedData.name, finalLat, finalLng);
            if (satellitePolygonId) {
                const satData = await getSatelliteNDVI(satellitePolygonId);
                if (satData.ndvi > 0) {
                    satelliteNDVI = satData.ndvi;
                    satelliteDate = satData.dt; 
                    showNotification(`NDVI Satelit: ${satelliteNDVI}`);
                }
            }
        } catch(e) { console.log("Satellite skip"); }
    }

    const finalStatus = submittedData.status 
        ? submittedData.status 
        : (satelliteNDVI > 0.7 ? 'sehat' : satelliteNDVI > 0.4 ? 'waspada' : 'bahaya');

    const dbPayload = {
        user_id: session.user.id,
        farmer_name: submittedData.farmer,
        contact: submittedData.contact,
        age: submittedData.age ? parseInt(submittedData.age) : null,
        join_date: submittedData.joinDate,
        farm_name: submittedData.name,
        size_ha: parseFloat(submittedData.size) || 0,
        lat: finalLat,
        lng: finalLng,
        planting_date: submittedData.plantingDate || null,
        harvest_date: submittedData.harvestDate || null,
        next_visit: submittedData.nextVisit || null,
        status: finalStatus, 
        ndvi: satelliteNDVI,
        satellite_date: satelliteDate,
        prediction: submittedData.prediction,
        est_value: submittedData.value,
        water_score: parseInt(submittedData.waterScore) || 0,
        fert_score: parseInt(submittedData.fertScore) || 0,
        pest_score: parseInt(submittedData.pestScore) || 0,
        polygon_data: submittedData.polygon, 
        external_polygon_id: satellitePolygonId
    };

    if (isActuallyOnline) {
        setIsDataLoading(true);
        try {
            if (editingFarm) {
                const { error } = await supabase.from('farms').update(dbPayload).eq('id', editingFarm.id);
                if (error) throw error;
                showNotification("Data diperbarui di Cloud!");
            } else {
                const { error } = await supabase.from('farms').insert([dbPayload]);
                if (error) throw error;
                showNotification("Tersimpan di Cloud!");
            }
            await fetchFarms();
        } catch (error) {
            showNotification("Gagal: " + error.message);
        } finally {
            setIsDataLoading(false);
        }
    } else {
        const actionType = editingFarm ? 'UPDATE' : 'INSERT';
        const offlinePayload = editingFarm ? { ...dbPayload, id: editingFarm.id } : dbPayload;
        addToQueue(actionType, offlinePayload);

        const tempId = editingFarm ? editingFarm.id : Date.now(); 
        const optimisticData = {
            id: tempId,
            farmer: dbPayload.farmer_name,
            name: dbPayload.farm_name,
            contact: dbPayload.contact,
            size: dbPayload.size_ha.toString(),
            lat: dbPayload.lat,
            lng: dbPayload.lng,
            status: dbPayload.status,
            ndvi: dbPayload.ndvi.toString(),
            prediction: dbPayload.prediction,
            value: dbPayload.est_value,
            nextVisit: dbPayload.next_visit,
            plots: generatePlots(dbPayload.status),
            lastUpdate: "Menunggu Sync...",
            polygon: submittedData.polygon || [],
            ...submittedData
        };

        if (editingFarm) {
            setFarms(farms.map(f => f.id === editingFarm.id ? optimisticData : f));
        } else {
            setFarms([optimisticData, ...farms]);
        }
        showNotification("TERSIMPAN LOKAL: Data akan dikirim saat koneksi stabil.");
    }
    setShowAddModal(false);
    setEditingFarm(null);
    setSelectedFarm(null);
  };

  const executeDelete = async () => {
    const isActuallyOnline = navigator.onLine && !isOffline;
    if (isActuallyOnline) {
        setIsDataLoading(true);
        try {
            if (farmToDelete) {
                await supabase.from('farms').delete().eq('id', farmToDelete.id);
            } else if (bulkDeleteIds.length > 0) {
                await supabase.from('farms').delete().in('id', bulkDeleteIds);
            }
            showNotification("Data dihapus permanen.");
            await fetchFarms();
        } catch (e) { showNotification("Gagal hapus: " + e.message); } 
        finally { setIsDataLoading(false); }
    } else {
        if (farmToDelete) {
            addToQueue('DELETE', { id: farmToDelete.id });
            setFarms(farms.filter(f => f.id !== farmToDelete.id));
        } else if (bulkDeleteIds.length > 0) {
            bulkDeleteIds.forEach(id => addToQueue('DELETE', { id }));
            setFarms(farms.filter(f => !bulkDeleteIds.includes(f.id)));
        }
        showNotification("OFFLINE: Data dihapus dari layar (Sync Nanti).");
    }
    setFarmToDelete(null); setBulkDeleteIds([]); setViewingFarm(null); setSelectedFarm(null);
  };

  const handleLocationUpdate = async (id, newLat, newLng, newPolygon) => {
    const dbPayload = { lat: newLat, lng: newLng };
    if (newPolygon) dbPayload.polygon_data = newPolygon;
    const isActuallyOnline = navigator.onLine && !isOffline;
    if (isActuallyOnline) {
        await supabase.from('farms').update(dbPayload).eq('id', id);
        showNotification("Posisi & Bentuk Lahan diperbarui!");
    } else {
        addToQueue('UPDATE', { id, ...dbPayload });
        showNotification("OFFLINE: Posisi baru disimpan lokal.");
    }
    setFarms(prevFarms => prevFarms.map(f => {
        if (f.id === id) { return { ...f, lat: newLat, lng: newLng, polygon: newPolygon || f.polygon }; }
        return f;
    }));
  };

  const handleProfileSave = async (villageData) => {
    if (!session || !navigator.onLine) {
        if (!navigator.onLine) showNotification("Edit profil butuh koneksi internet.");
        return; 
    }
    const updates = { 
        id: session.user.id, full_name: session.user.user_metadata.full_name, 
        village_data: villageData, updated_at: new Date() 
    };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) { 
        setUserProfile({ ...userProfile, villageData }); 
        showNotification("Profil dan Wilayah Kerja tersimpan!"); 
    } else {
        showNotification("Gagal menyimpan profil.");
    }
  };

  const handleDownloadReport = () => {
    if (farms.length === 0) {
        showNotification("Tidak ada data untuk diunduh.");
        return;
    }
    try {
        showNotification("Menyiapkan dokumen PDF...");
        generatePDFReport(farms, userProfile);
        setTimeout(() => { showNotification("Laporan berhasil diunduh!"); }, 1500);
    } catch (error) {
        console.error("Download Error:", error);
        showNotification("Gagal membuat laporan PDF.");
    }
  };

  const executeLoadSimulation = async () => {
    if (!session) return;
    setIsDataLoading(true);
    try {
        const centerLat = userProfile?.villageData?.lat || -6.2088;
        const centerLng = userProfile?.villageData?.lng || 106.8456;
        const simulationPayloads = initialFarms.map((farm) => {
            const latOffset = (Math.random() - 0.5) * 0.015;
            const lngOffset = (Math.random() - 0.5) * 0.015;
            return {
                user_id: session.user.id, farmer_name: farm.farmer, contact: farm.contact,
                age: parseInt(farm.age) || 40, join_date: farm.joinDate || new Date().toISOString(),
                farm_name: farm.name, size_ha: parseFloat(farm.size) || 1.0,
                lat: centerLat + latOffset, lng: centerLng + lngOffset,
                planting_date: farm.plantingDate, harvest_date: farm.harvestDate,
                next_visit: farm.nextVisit, status: farm.status, ndvi: parseFloat(farm.ndvi),
                prediction: farm.prediction, est_value: farm.value,
                water_score: farm.waterScore || 80, fert_score: farm.fertScore || 80, pest_score: farm.pestScore || 80,
                external_polygon_id: null, polygon_data: null 
            };
        });
        const { error } = await supabase.from('farms').insert(simulationPayloads);
        if (error) throw error;
        await fetchFarms();
        showNotification("Berhasil! 4 Data Simulasi telah ditambahkan.");
    } catch (error) {
        showNotification("Gagal memuat simulasi: " + error.message);
    } finally {
        setIsDataLoading(false);
    }
  };

  // ==========================================
  // FIX: HANDLER KUNJUNGAN (ANTI BUG ZONA WAKTU)
  // ==========================================
  const handleVisitSaved = async (arg1, arg2) => { 
    if (!completingFarm) return;

    // 1. Ekstrak data
    let visitNotes = '';
    let nextVisitInput = null;

    if (typeof arg1 === 'object' && arg1 !== null) {
        visitNotes = arg1.notes || arg1.note || '';
        nextVisitInput = arg1.nextVisit || arg1.date;
    } else {
        visitNotes = arg1;
        nextVisitInput = arg2;
    }

    // 2. Olah Tanggal dengan TRICK 12 SIANG (Noon Trick)
    let nextVisitISO;
    
    if (nextVisitInput !== null && nextVisitInput !== undefined) {
        const inputStr = String(nextVisitInput).trim();
        
        // SKENARIO A: Rutin (Otomatis Tambah Hari)
        if (/^\d{1,3}$/.test(inputStr)) {
            const d = new Date();
            d.setDate(d.getDate() + parseInt(inputStr, 10));
            d.setHours(12, 0, 0, 0); // <--- KUNCI: Paksa jam 12 siang
            nextVisitISO = d.toISOString();
        } 
        // SKENARIO B: Manual Kalender
        else {
            const parsedDate = new Date(inputStr);
            
            if (!isNaN(parsedDate.getTime())) {
                if (parsedDate.getFullYear() < 2024) {
                    parsedDate.setFullYear(new Date().getFullYear()); 
                }
                parsedDate.setHours(12, 0, 0, 0); // <--- KUNCI: Paksa jam 12 siang
                nextVisitISO = parsedDate.toISOString();
            } else {
                // Fallback
                const d = new Date();
                d.setDate(d.getDate() + 7);
                d.setHours(12, 0, 0, 0);
                nextVisitISO = d.toISOString();
            }
        }
    } else {
        // Default jika kosong (7 hari)
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(12, 0, 0, 0);
        nextVisitISO = d.toISOString();
    }

    // 3. Siapkan Payload untuk tabel visit_logs
    const newLog = {
        farm_id: completingFarm.id,
        visited_at: new Date().toISOString(), 
        notes: visitNotes || 'Pengecekan rutin dan wawancara petani.', 
        status_snapshot: completingFarm.status,
        officer_name: userProfile?.full_name || 'Komunikator Lapangan'
    };

    // 4. Update State Lokal (Langsung berubah, anti glitch)
    const updatedHistory = [newLog, ...(completingFarm.visitHistory || [])];
    
    setFarms(prevFarms => prevFarms.map(f => {
        if (f.id === completingFarm.id) {
            return { ...f, visitHistory: updatedHistory, nextVisit: nextVisitISO };
        }
        return f;
    }));

    // Update UI Detail Lahan
    if (selectedFarm && selectedFarm.id === completingFarm.id) {
        setSelectedFarm(prev => ({ ...prev, visitHistory: updatedHistory, nextVisit: nextVisitISO }));
    }

    // 5. Eksekusi ke Supabase
    const isActuallyOnline = navigator.onLine && !isOffline;
    
    if (isActuallyOnline) {
        try {
            // A. Simpan Log
            const { error: logError } = await supabase.from('visit_logs').insert([newLog]);
            if (logError) throw logError;

            // B. Update Jadwal (Dengan tanggal yang kebal Timezone)
            const { error: farmError } = await supabase.from('farms').update({ next_visit: nextVisitISO }).eq('id', completingFarm.id);
            if (farmError) throw farmError;
            
            showNotification("✅ Kunjungan berhasil dicatat ke server!"); 
            
            // Tarik data baru di background
            fetchFarms(); 
        } catch(e) { 
            console.error("Supabase Error:", e);
            showNotification("❌ Gagal menyimpan data."); 
        }
    } else {
        addToQueue('UPDATE', { id: completingFarm.id, next_visit: nextVisitISO });
        showNotification("✅ Kunjungan dicatat (Offline)."); 
    }
    
    setCompletingFarm(null); 
};

  const handleLoadSimulationClick = () => setShowSimModal(true); 
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); setUserProfile(null); setActiveTab('peta'); };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const confirmDelete = (farm) => { setFarmToDelete(farm); setBulkDeleteIds([]); };
  const confirmBulkDelete = (ids) => { setBulkDeleteIds(ids); setFarmToDelete(null); };

  // --- RENDER ---
  if (isLoadingAuth) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 size={40} className="text-emerald-600 animate-spin"/></div>;
  if (!session) return <AuthScreen />;

  return (
    <MainLayout 
        user={{...session.user, ...userProfile}} 
        activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}
        isOffline={isOffline} toggleOffline={() => setIsOffline(!isOffline)}
        onGlobalScan={handleGlobalScan} offlineQueueCount={offlineQueueCount} onSync={handleManualSync}
    >
      {(isDataLoading || isSyncing) && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[10000] flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
                {isSyncing ? <RefreshCw size={24} className="text-blue-600 animate-spin"/> : <Loader2 size={24} className="text-emerald-600 animate-spin"/>}
                <span className="font-bold text-slate-700">{isSyncing ? "Menyinkronkan..." : "Loading..."}</span>
            </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-20 right-4 md:top-6 md:right-6 z-[11000] animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center border border-slate-700 max-w-[85vw] md:max-w-md">
             <Database className="w-5 h-5 mr-3 text-emerald-400 shrink-0" /> 
             <span className="text-sm font-medium leading-snug">{notification}</span>
          </div>
        </div>
      )}

      {isUnstable && !isOffline && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-6 md:left-auto md:right-24 z-[11000] animate-in slide-in-from-bottom-4 duration-500 w-full max-w-sm px-4">
           <div className="bg-orange-600/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl border border-orange-500 flex flex-col items-start gap-2">
              <div className="flex items-center space-x-2"><SignalLow size={20} className="animate-pulse"/> <span className="font-bold text-sm">Sinyal Tidak Stabil</span></div>
              <p className="text-xs text-orange-100 leading-tight">Proses penyimpanan data mungkin gagal atau lambat.</p>
              <div className="flex space-x-2 w-full mt-1">
                  <button onClick={() => setIsUnstable(false)} className="flex-1 py-1.5 px-3 bg-orange-700 hover:bg-orange-800 rounded-lg text-xs font-bold transition-colors">Abaikan</button>
                  <button onClick={() => { setIsOffline(true); setIsUnstable(false); }} className="flex-1 py-1.5 px-3 bg-white text-orange-700 hover:bg-orange-50 rounded-lg text-xs font-bold shadow-sm transition-colors">Masuk Offline Mode</button>
              </div>
           </div>
        </div>
      )}

      <AddDataModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingFarm(null); }} onSave={handleFormSubmit} initialData={editingFarm} userLocation={userProfile?.villageData} />
      <CompleteVisitModal isOpen={!!completingFarm} onClose={() => setCompletingFarm(null)} onSave={handleVisitSaved} farmName={completingFarm?.farmer} />
      <DeleteModal isOpen={!!farmToDelete || bulkDeleteIds.length > 0} onClose={() => { setFarmToDelete(null); setBulkDeleteIds([]); }} onConfirm={executeDelete} farmName={farmToDelete ? farmToDelete.farmer : `${bulkDeleteIds.length} Data Terpilih`} />
      <FarmerDetailModal isOpen={!!viewingFarm} onClose={() => setViewingFarm(null)} farm={viewingFarm} />
      <SetupProfileModal isOpen={session && !userProfile?.villageData} onSave={handleProfileSave} userName={session?.user?.user_metadata?.full_name || 'Komunikator'} />
      <ConfirmationModal isOpen={showSimModal} onClose={() => setShowSimModal(false)} onConfirm={executeLoadSimulation} title="Muat Simulasi?" message="Data dummy akan ditambahkan." type="info" confirmLabel="Muat" />
      <CheckInModal isOpen={!!checkInFarm} onClose={() => setCheckInFarm(null)} farm={checkInFarm} onConfirm={executeCheckIn} />

      {activeTab === 'profil' ? (
        <ProfileView user={{...session.user, ...userProfile}} farms={farms} onSaveProfile={handleProfileSave} isOffline={isOffline} offlineQueueCount={offlineQueueCount} onSync={handleManualSync} />
      ) : farms.length === 0 && !isDataLoading ? (
        <EmptyState onAddManual={() => { setEditingFarm(null); setShowAddModal(true); }} onLoadDummy={handleLoadSimulationClick} />
      ) : (
        <>
          {activeTab === 'peta' && (selectedFarm ? 
            <FarmerDetailFull farm={selectedFarm} user={userProfile} onBack={() => setSelectedFarm(null)} onCompleteVisit={(f) => setCompletingFarm(f)} onEdit={(f) => { setEditingFarm(f); setShowAddModal(true); }} onDelete={(f) => confirmDelete(f)}/> : 
            <MapView farms={farms} isOffline={isOffline} onSelectFarm={setSelectedFarm} user={userProfile} onUpdateLocation={handleLocationUpdate} onDownloadReport={handleDownloadReport}/>
          )}
          {activeTab === 'data' && <DataView farms={farms} />}
          {activeTab === 'petani' && (
            <FarmerView farms={farms} onAddClick={() => { setEditingFarm(null); setShowAddModal(true); }} onEditClick={(f) => { setEditingFarm(f); setShowAddModal(true); }} onDeleteClick={confirmDelete} onDeleteBulk={confirmBulkDelete} onViewDetail={setViewingFarm} />
          )}
        </>
      )}
    </MainLayout>
  );
};

export default App;