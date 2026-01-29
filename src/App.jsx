import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabaseClient'; 
import { registerPolygonToSatellite, getSatelliteNDVI } from './lib/satelliteApi';
import { addToQueue, processOfflineQueue, getQueue } from './lib/offlineSync'; 

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
  // --- STATE AUTH ---
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // --- STATE UI ---
  const [activeTab, setActiveTab] = useState('peta');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [notification, setNotification] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  
  // State untuk Profil & Header Badge
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  
  // --- STATE DATA ---
  const [farms, setFarms] = useState(() => {
    const savedData = localStorage.getItem('hytani_data');
    return savedData ? JSON.parse(savedData) : []; 
  });

  // --- STATE MODALS ---
  const [selectedFarm, setSelectedFarm] = useState(null); 
  const [viewingFarm, setViewingFarm] = useState(null);   
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null); 
  const [completingFarm, setCompletingFarm] = useState(null);
  const [farmToDelete, setFarmToDelete] = useState(null); 
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]); 
  const [showSimModal, setShowSimModal] = useState(false);
  
  // State Baru untuk Check-In QR
  const [checkInFarm, setCheckInFarm] = useState(null); 

  // ==========================================
  // 1. AUTH & INITIALIZATION
  // ==========================================
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
    const handleOnline = async () => {
        setIsOffline(false);
        showNotification("Koneksi Kembali! Memproses antrian offline...");
        handleManualSync();
    };

    const handleOffline = () => {
        setIsOffline(true);
        showNotification("Mode Offline Aktif. Data akan disimpan lokal.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const queueInterval = setInterval(() => {
        const queue = getQueue();
        setOfflineQueueCount(queue.length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) setUserProfile({ ...data, villageData: data.village_data });
    } catch (e) {
        console.log("Offline: Gagal fetch profil");
    }
  };

  const fetchFarms = async () => {
    if (!navigator.onLine) return; 
    setIsDataLoading(true);
    try {
      const { data, error } = await supabase.from('farms').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const mappedData = data.map(f => ({
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
      }));
      setFarms(mappedData);
    } catch (error) { console.log("Fetch skipped / Error"); } 
    finally { setIsDataLoading(false); }
  };

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  
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
          showNotification(`✅ Check-In Berhasil! Jadwal berikutnya: ${new Date(data.next_visit).toLocaleDateString('id-ID')}`);
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

    if (navigator.onLine && !editingFarm) {
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
        } catch(e) { console.log("Satellite skip offline"); }
    }

    // LOGIKA PERBAIKAN STATUS (Bugfix sebelumnya)
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
        status: finalStatus, // Gunakan status final
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

    if (navigator.onLine) {
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
        showNotification("OFFLINE: Data disimpan di perangkat. Akan dikirim saat online.");
    }
    setShowAddModal(false);
    setEditingFarm(null);
    setSelectedFarm(null);
  };

  const executeDelete = async () => {
    if (navigator.onLine) {
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

    if (navigator.onLine) {
        await supabase.from('farms').update(dbPayload).eq('id', id);
        showNotification("Posisi & Bentuk Lahan diperbarui!");
    } else {
        addToQueue('UPDATE', { id, ...dbPayload });
        showNotification("OFFLINE: Posisi baru disimpan lokal.");
    }

    setFarms(prevFarms => prevFarms.map(f => {
        if (f.id === id) {
            return { ...f, lat: newLat, lng: newLng, polygon: newPolygon || f.polygon };
        }
        return f;
    }));
  };

  const handleProfileSave = async (villageData) => {
    if (!session || !navigator.onLine) {
        if (!navigator.onLine) showNotification("Edit profil butuh koneksi internet.");
        return; 
    }
    const updates = { 
        id: session.user.id, 
        full_name: session.user.user_metadata.full_name, 
        village_data: villageData, 
        updated_at: new Date() 
    };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) { 
        setUserProfile({ ...userProfile, villageData }); 
        showNotification("Profil dan Wilayah Kerja tersimpan!"); 
    } else {
        showNotification("Gagal menyimpan profil.");
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
                user_id: session.user.id,
                farmer_name: farm.farmer,
                contact: farm.contact,
                age: parseInt(farm.age) || 40,
                join_date: farm.joinDate || new Date().toISOString(),
                farm_name: farm.name,
                size_ha: parseFloat(farm.size) || 1.0,
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset,
                planting_date: farm.plantingDate,
                harvest_date: farm.harvestDate,
                next_visit: farm.nextVisit,
                status: farm.status,
                ndvi: parseFloat(farm.ndvi),
                prediction: farm.prediction,
                est_value: farm.value,
                water_score: farm.waterScore || 80,
                fert_score: farm.fertScore || 80,
                pest_score: farm.pestScore || 80,
                external_polygon_id: null,
                polygon_data: null 
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

  const handleLoadSimulationClick = () => setShowSimModal(true); 
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); setUserProfile(null); setActiveTab('peta'); };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const confirmDelete = (farm) => { setFarmToDelete(farm); setBulkDeleteIds([]); };
  const confirmBulkDelete = (ids) => { setBulkDeleteIds(ids); setFarmToDelete(null); };
  const handleVisitSaved = () => { setCompletingFarm(null); showNotification("Kunjungan dicatat!"); };
  const handleDownloadReport = () => { showNotification("Mengunduh data..."); };

  // --- RENDER ---
  if (isLoadingAuth) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 size={40} className="text-emerald-600 animate-spin"/></div>;
  if (!session) return <AuthScreen />;

  return (
    <MainLayout 
        user={{...session.user, ...userProfile}} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOffline={isOffline}
        toggleOffline={() => setIsOffline(!isOffline)}
        onGlobalScan={handleGlobalScan}
        offlineQueueCount={offlineQueueCount} // <--- Pass ke Layout
        onSync={handleManualSync}             // <--- Pass ke Layout
    >
      
      {/* GLOBAL LOADING */}
      {(isDataLoading || isSyncing) && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
                {isSyncing ? <RefreshCw size={24} className="text-blue-600 animate-spin"/> : <Loader2 size={24} className="text-emerald-600 animate-spin"/>}
                <span className="font-bold text-slate-700">{isSyncing ? "Menyinkronkan..." : "Loading..."}</span>
            </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/90 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce flex items-center">
          <Database className="w-5 h-5 mr-3 text-emerald-400" /> <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-slate-800 text-white py-2 px-4 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center">
           <CloudOff size={16} className="mr-2 text-slate-400" /> Mode Offline Aktif
        </div>
      )}

      {/* --- GLOBAL MODALS --- */}
      <AddDataModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingFarm(null); }} onSave={handleFormSubmit} initialData={editingFarm} userLocation={userProfile?.villageData} />
      <CompleteVisitModal isOpen={!!completingFarm} onClose={() => setCompletingFarm(null)} onSave={handleVisitSaved} farmName={completingFarm?.farmer} />
      <DeleteModal isOpen={!!farmToDelete || bulkDeleteIds.length > 0} onClose={() => { setFarmToDelete(null); setBulkDeleteIds([]); }} onConfirm={executeDelete} farmName={farmToDelete ? farmToDelete.farmer : `${bulkDeleteIds.length} Data Terpilih`} />
      <FarmerDetailModal isOpen={!!viewingFarm} onClose={() => setViewingFarm(null)} farm={viewingFarm} />
      <SetupProfileModal isOpen={session && !userProfile?.villageData} onSave={handleProfileSave} userName={session?.user?.user_metadata?.full_name || 'Komunikator'} />
      <ConfirmationModal isOpen={showSimModal} onClose={() => setShowSimModal(false)} onConfirm={executeLoadSimulation} title="Muat Simulasi?" message="Data dummy akan ditambahkan." type="info" confirmLabel="Muat" />
      
      {/* MODAL CHECK-IN BARU */}
      <CheckInModal 
        isOpen={!!checkInFarm} 
        onClose={() => setCheckInFarm(null)} 
        farm={checkInFarm} 
        onConfirm={executeCheckIn} 
      />

      {/* --- PAGE CONTENT --- */}
      {activeTab === 'profil' ? (
        <ProfileView 
            user={{...session.user, ...userProfile}}
            farms={farms}
            onSaveProfile={handleProfileSave}
            isOffline={isOffline}
            offlineQueueCount={offlineQueueCount}
            onSync={handleManualSync}
        />
      ) : farms.length === 0 && !isDataLoading ? (
        <EmptyState 
            onAddManual={() => { setEditingFarm(null); setShowAddModal(true); }} 
            onLoadDummy={handleLoadSimulationClick} 
        />
      ) : (
        <>
          {activeTab === 'peta' && (selectedFarm ? 
            <FarmerDetailFull farm={selectedFarm} onBack={() => setSelectedFarm(null)} onCompleteVisit={(f) => setCompletingFarm(f)} onEdit={(f) => { setEditingFarm(f); setShowAddModal(true); }} onDelete={(f) => confirmDelete(f)}/> : 
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