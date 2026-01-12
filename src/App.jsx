import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, CloudOff } from 'lucide-react';

import { initialFarms, generatePlots } from './data/mockData';

import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddDataModal from './components/AddDataModal';
import SetupProfileModal from './components/SetupProfileModal';
import EmptyState from './components/EmptyState';
import DeleteModal from './components/DeleteModal';
import CompleteVisitModal from './components/CompleteVisitModal';
import FarmerDetailModal from './components/FarmerDetailModal'; 

import MapView from './layouts/MapView';
import DataView from './layouts/DataView';
import FarmerView from './layouts/FarmerView';
import FarmerDetailFull from './layouts/FarmerDetailFull'; 

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('peta');
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [selectedFarm, setSelectedFarm] = useState(null); 
  const [viewingFarm, setViewingFarm] = useState(null);   
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null); 
  
  // DELETE STATES
  const [farmToDelete, setFarmToDelete] = useState(null); // Single delete
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]); // Bulk delete

  const [completingFarm, setCompletingFarm] = useState(null);

  const [farms, setFarms] = useState(() => {
    const savedData = localStorage.getItem('hytani_data');
    return savedData ? JSON.parse(savedData) : []; 
  });

  useEffect(() => {
    localStorage.setItem('hytani_data', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotification("Koneksi Kembali! Sinkronisasi data ke Cloud...");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotification("Koneksi Terputus. Beralih ke Mode Offline.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('hytani_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hytani_session');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('peta');
  };

  const handleProfileSave = (villageData) => {
    const updatedUser = { ...currentUser, isProfileComplete: true, villageData: villageData };
    setCurrentUser(updatedUser);
    localStorage.setItem('hytani_session', JSON.stringify(updatedUser));
    const allUsers = JSON.parse(localStorage.getItem('hytani_users') || '[]');
    const updatedAllUsers = allUsers.map(u => u.email === currentUser.email ? updatedUser : u);
    localStorage.setItem('hytani_users', JSON.stringify(updatedAllUsers));
    showNotification(`Selamat datang di Dashboard Desa ${villageData.villageName}!`);
  };

  const handleLocationUpdate = (id, newLat, newLng) => {
    const updatedFarms = farms.map(f => {
      if (f.id === id) {
        return { ...f, lat: newLat, lng: newLng, polygon: [] };
      }
      return f;
    });
    setFarms(updatedFarms);
    if (selectedFarm && selectedFarm.id === id) {
       const updatedFarm = updatedFarms.find(f => f.id === id);
       setSelectedFarm(updatedFarm);
    }
    showNotification("Lokasi diperbarui (Disimpan Lokal)");
  };

  const handleDownloadReport = () => {
    if (farms.length === 0) {
      showNotification("Tidak ada data untuk diunduh.");
      return;
    }

    const villageName = currentUser?.villageData?.villageName || "Wilayah_Indonesia";
    const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    const filename = `Laporan_HYTANI_${villageName}_${date}.csv`;

    let csvContent = `LAPORAN MONITORING HY-TANI\n`;
    csvContent += `Wilayah: ${villageName.toUpperCase()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n`;
    csvContent += `Total Lahan: ${farms.length} Unit\n`;
    csvContent += `\n`; 

    csvContent += "No,Nama Petani,Usia,Kontak,Nama Lahan,Luas,Status,NDVI,Prediksi Panen,Estimasi Nilai,Jadwal Visit\n";

    farms.forEach((farm, index) => {
      const safeName = `"${farm.farmer}"`;
      const safeContact = `"${farm.contact || '-'}"`;
      const safeFarmName = `"${farm.name}"`;
      const safeSize = `"${farm.size}"`;
      const safePred = `"${farm.prediction}"`;
      const safeValue = `"${farm.value}"`;

      const row = [
        index + 1,
        safeName,
        farm.age || '-',
        safeContact,
        safeFarmName,
        safeSize,
        farm.status.toUpperCase(),
        farm.ndvi,
        safePred,
        safeValue,
        `"${farm.nextVisit}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Laporan CSV berhasil diunduh!");
  };

  const handleFormSubmit = (submittedData) => {
    if (editingFarm) {
      const updatedFarms = farms.map(f => {
        if (f.id === editingFarm.id) {
          const isStatusChanged = submittedData.status !== f.status;
          const newPlots = isStatusChanged ? generatePlots(submittedData.status) : f.plots;

          return { 
            ...f, 
            ...submittedData, // Ini sudah membawa lat/lng baru jika diedit di peta
            plots: newPlots, 
            lastUpdate: 'Baru Saja'
          };
        }
        return f;
      });
      setFarms(updatedFarms);
      
      if (selectedFarm && selectedFarm.id === editingFarm.id) {
         setSelectedFarm(updatedFarms.find(f => f.id === editingFarm.id));
      }
      if (viewingFarm && viewingFarm.id === editingFarm.id) {
         setViewingFarm(updatedFarms.find(f => f.id === editingFarm.id));
      }
      
      showNotification("Data berhasil diperbarui!");
    } else {
      const newId = farms.length > 0 ? Math.max(...farms.map(f => f.id)) + 1 : 1;
      
      // Jika user klik peta, submittedData.lat ada isinya. Gunakan itu.
      // Jika entah bagaimana kosong, fallback ke random offset.
      const villageLat = currentUser?.villageData?.lat || -6.2088;
      const villageLng = currentUser?.villageData?.lng || 106.8456;
      const randomOffset = () => (Math.random() - 0.5) * 0.003; 

      const finalLat = submittedData.lat || (villageLat + randomOffset());
      const finalLng = submittedData.lng || (villageLng + randomOffset());

      const newFarm = {
        id: newId,
        ...submittedData, // Termasuk lat/lng dari modal
        lat: finalLat,
        lng: finalLng,
        polygon: [], // Biarkan kosong agar digambar otomatis berdasarkan size
        lastUpdate: 'Baru Saja',
        plots: generatePlots(submittedData.status)
      };
      setFarms([...farms, newFarm]);
      showNotification("Data Petani Baru Berhasil Disimpan!");
    }
    setShowAddModal(false);
    setEditingFarm(null);
  };

  // --- DELETE LOGIC ---
  const confirmDelete = (farm) => {
    setFarmToDelete(farm);
    setBulkDeleteIds([]); // Reset bulk jika ada
  };

  const confirmBulkDelete = (ids) => {
    setBulkDeleteIds(ids);
    setFarmToDelete(null); // Reset single jika ada
  };

  const executeDelete = () => {
    // KASUS 1: DELETE SINGLE
    if (farmToDelete) {
      const updatedFarms = farms.filter(f => f.id !== farmToDelete.id);
      setFarms(updatedFarms);
      setFarmToDelete(null);
      showNotification("Data dihapus.");
      if (viewingFarm && viewingFarm.id === farmToDelete.id) setViewingFarm(null);
      if (selectedFarm && selectedFarm.id === farmToDelete.id) setSelectedFarm(null);
    }
    // KASUS 2: DELETE BULK
    else if (bulkDeleteIds.length > 0) {
        const updatedFarms = farms.filter(f => !bulkDeleteIds.includes(f.id));
        setFarms(updatedFarms);
        setBulkDeleteIds([]);
        showNotification(`${bulkDeleteIds.length} Data berhasil dihapus.`);
        // Reset view jika yang dilihat ikut terhapus
        if (viewingFarm && bulkDeleteIds.includes(viewingFarm.id)) setViewingFarm(null);
        if (selectedFarm && bulkDeleteIds.includes(selectedFarm.id)) setSelectedFarm(null);
    }
  };

  const handleLoadSimulation = () => {
    const centerLat = currentUser?.villageData?.lat || -6.2088;
    const centerLng = currentUser?.villageData?.lng || 106.8456;

    const simulatedFarms = initialFarms.map((farm, index) => {
      const latOffset = (Math.random() - 0.5) * 0.006; 
      const lngOffset = (Math.random() - 0.5) * 0.006;

      return {
        ...farm,
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
      };
    });

    setFarms(simulatedFarms);
    showNotification("Data Simulasi Dimuat di Lokasi Desa Anda!");
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const openCompleteModal = (farm) => {
    setCompletingFarm(farm); 
  };

  const handleVisitSaved = (visitData) => {
    if (!completingFarm) return;

    const updatedFarms = farms.map(f => {
      if (f.id === completingFarm.id) {
        const oldHistory = f.visitHistory || [];
        const newHistoryEntry = {
          completedDate: visitData.completedDate,
          note: visitData.note
        };
        return {
          ...f,
          visitHistory: [newHistoryEntry, ...oldHistory],
          nextVisit: visitData.nextVisit,
          lastUpdate: 'Baru Saja'
        };
      }
      return f;
    });

    setFarms(updatedFarms);
    const updatedCurrentFarm = updatedFarms.find(f => f.id === completingFarm.id);
    if (selectedFarm && selectedFarm.id === completingFarm.id) {
        setSelectedFarm(updatedCurrentFarm);
    }

    setCompletingFarm(null); 
    showNotification("Kunjungan Selesai! Disimpan Lokal.");
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* MODALS */}
      <AddDataModal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setEditingFarm(null); }} 
        onSave={handleFormSubmit} 
        initialData={editingFarm}
        userLocation={currentUser?.villageData}
      />
      <CompleteVisitModal 
        isOpen={!!completingFarm} 
        onClose={() => setCompletingFarm(null)} 
        onSave={handleVisitSaved} 
        farmName={completingFarm?.farmer} 
      />
      
      {/* DELETE MODAL: MENANGANI SINGLE & BULK */}
      <DeleteModal 
        isOpen={!!farmToDelete || bulkDeleteIds.length > 0} 
        onClose={() => { setFarmToDelete(null); setBulkDeleteIds([]); }} 
        onConfirm={executeDelete} 
        farmName={farmToDelete ? farmToDelete.farmer : `${bulkDeleteIds.length} Data Terpilih`} 
      />

      <FarmerDetailModal 
        isOpen={!!viewingFarm} 
        onClose={() => setViewingFarm(null)} 
        farm={viewingFarm} 
      />
      <SetupProfileModal 
        isOpen={isAuthenticated && currentUser && !currentUser.isProfileComplete} 
        onSave={handleProfileSave} 
        userName={currentUser?.name?.split(' ')[0]} 
      />

      {notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-[90] bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce flex items-center border border-slate-700">
          <Database className="w-5 h-5 mr-3 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {isOffline && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-slate-800 text-white py-2 px-4 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center animate-in slide-in-from-bottom-full">
           <CloudOff size={16} className="mr-2 text-slate-400" />
           Mode Offline: Data disimpan di perangkat. Sinkronisasi otomatis saat online.
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <Sidebar 
        isOpen={isSidebarOpen} setIsOpen={setSidebarOpen}
        activeTab={activeTab} setActiveTab={setActiveTab}
        isOffline={isOffline} toggleOffline={() => setIsOffline(!isOffline)}
        onLogout={handleLogout} user={currentUser}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        <Header activeTab={activeTab} isOffline={isOffline} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          {farms.length === 0 ? (
            <EmptyState 
              onAddManual={() => { setEditingFarm(null); setShowAddModal(true); }} 
              onLoadDummy={handleLoadSimulation}
            />
          ) : (
            <>
              {activeTab === 'peta' && (
                selectedFarm ? (
                  <FarmerDetailFull 
                    farm={selectedFarm}
                    onBack={() => setSelectedFarm(null)}
                    onCompleteVisit={openCompleteModal}
                    onEdit={(farm) => { setEditingFarm(farm); setShowAddModal(true); }}
                    onDelete={(farm) => confirmDelete(farm)}
                  />
                ) : (
                  <MapView 
                    farms={farms} 
                    isOffline={isOffline} 
                    onSelectFarm={setSelectedFarm} 
                    user={currentUser} 
                    onUpdateLocation={handleLocationUpdate}
                    onDownloadReport={handleDownloadReport}
                  />
                )
              )}
              {activeTab === 'data' && <DataView farms={farms} />}
              {activeTab === 'petani' && (
                <FarmerView 
                  farms={farms} 
                  onAddClick={() => { setEditingFarm(null); setShowAddModal(true); }} 
                  onEditClick={(farm) => { setEditingFarm(farm); setShowAddModal(true); }}
                  onDeleteClick={confirmDelete}
                  onDeleteBulk={confirmBulkDelete} // Props Baru
                  onViewDetail={setViewingFarm} 
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;