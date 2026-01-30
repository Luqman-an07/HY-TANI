import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Search, Bell, X, Wifi, WifiOff, CheckCircle, Info, AlertTriangle, 
  Map as MapIcon, Database, Users, Sprout, LogOut, ScanLine, 
  ChevronLeft, ChevronRight, UploadCloud 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import QRScannerModal from '../components/QRScannerModal';
import ConfirmationModal from '../components/ConfirmationModal';

// --- KOMPONEN MENU BUTTON (Tetap Sama) ---
const MenuButton = ({ icon, label, active, onClick, isCollapsed }) => (
  <button 
    onClick={onClick} 
    className={`
      relative flex items-center transition-all duration-200 group
      ${isCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-xl px-0' : 'w-full space-x-3 px-4 py-3.5 rounded-xl'}
      ${active ? 'bg-emerald-800 text-white font-bold shadow-lg ring-1 ring-emerald-700' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}
    `}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'} shrink-0 z-10`}>
      {icon}
    </div>

    {!isCollapsed && (
      <span className="tracking-wide text-sm whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 truncate">
        {label}
      </span>
    )}

    {isCollapsed && (
      <div className="absolute left-16 z-[999] bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-2xl border border-slate-600 pointer-events-none origin-left scale-95 group-hover:scale-100">
        {label}
        <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-4 border-transparent border-r-slate-800"></div>
      </div>
    )}
 </button>
);

const MainLayout = ({ children, user, activeTab, setActiveTab, onLogout, isOffline, toggleOffline, onGlobalScan, offlineQueueCount, onSync }) => {
  
  // --- STATE UI ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // --- STATE NOTIFIKASI ---
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- LOGIKA HEADER ---
  const getPageTitle = () => {
    switch (activeTab) {
      case 'peta': return { title: 'Peta Satelit', subtitle: 'Monitoring Lahan Real-time' };
      case 'data': return { title: 'Analisis Data', subtitle: 'Statistik & Ekonomi' };
      case 'petani': return { title: 'Manajemen Petani', subtitle: 'Database Mitra' };
      case 'profil': return { title: 'Profil Saya', subtitle: 'Pengaturan Akun & Wilayah' };
      default: return { title: 'Dashboard', subtitle: 'Overview' };
    }
  };
  const { title, subtitle } = getPageTitle();

  useEffect(() => {
    fetchNotifications();
    const channel = supabase.channel('header-notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    if (!navigator.onLine) return;
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({...n, is_read: true})));
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const getNotifIcon = (type) => {
    switch(type) {
        case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
        case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
        default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const displayName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const getInitials = (name) => (!name ? 'U' : name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase());

  const handleScanSuccess = (scannedId) => {
    setIsScannerOpen(false);
    if (onGlobalScan) onGlobalScan(scannedId);
  };

  const handleProfileClick = () => {
      setActiveTab('profil');
      setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
      <ConfirmationModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={onLogout} title="Konfirmasi Keluar" message="Apakah Anda yakin ingin keluar?" type="danger" confirmLabel="Ya, Keluar" />

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-[2999] md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[3000] bg-emerald-900 text-white flex flex-col shadow-2xl transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full'} md:relative md:translate-x-0 md:inset-auto md:shadow-none ${isSidebarOpen ? 'md:w-72' : 'md:w-20'}`}>
        <div className={`p-4 border-b border-emerald-800 flex items-center bg-emerald-950/30 h-20 transition-all duration-300 ${isSidebarOpen ? 'justify-between px-6' : 'justify-center px-0'}`}>
          <div className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center w-full'} overflow-hidden`}>
            <div className="bg-white p-1.5 rounded-xl shadow-lg shrink-0 transition-transform hover:scale-105 z-10"><Sprout className="w-6 h-6 text-emerald-700" /></div>
            {isSidebarOpen && (<div className="whitespace-nowrap animate-in fade-in duration-300"><h1 className="text-xl font-bold tracking-tight">HY-TANI</h1><p className="text-[9px] text-emerald-300 uppercase tracking-widest font-semibold">Satelit Inklusif</p></div>)}
          </div>
          {isSidebarOpen && (<button onClick={toggleSidebar} className="hidden md:flex bg-emerald-800 hover:bg-emerald-700 text-emerald-200 p-1 rounded-full shadow-inner transition-colors"><ChevronLeft size={16} /></button>)}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-emerald-300 p-1 rounded hover:bg-emerald-800"><X size={24} /></button>
        </div>
        {!isSidebarOpen && (<button onClick={toggleSidebar} className="hidden md:flex mx-auto mt-3 bg-emerald-800/50 hover:bg-emerald-700 text-emerald-200 p-1.5 rounded-full transition-colors z-10" title="Buka Menu"><ChevronRight size={16} /></button>)}
        <nav className={`flex-1 px-3 py-4 space-y-2 ${isSidebarOpen ? 'overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-emerald-800' : 'overflow-visible'}`}>
          <MenuButton isCollapsed={!isSidebarOpen} icon={<MapIcon size={20}/>} label="Peta Satelit" active={activeTab === 'peta'} onClick={() => {setActiveTab('peta'); setIsMobileMenuOpen(false);}} />
          <MenuButton isCollapsed={!isSidebarOpen} icon={<Database size={20}/>} label="Analisis Panen" active={activeTab === 'data'} onClick={() => {setActiveTab('data'); setIsMobileMenuOpen(false);}} />
          <MenuButton isCollapsed={!isSidebarOpen} icon={<Users size={20}/>} label="Petani Binaan" active={activeTab === 'petani'} onClick={() => {setActiveTab('petani'); setIsMobileMenuOpen(false);}} />
        </nav>
        <div className="p-4 bg-emerald-950/40 border-t border-emerald-800/50 backdrop-blur-sm z-10">
          <button onClick={handleProfileClick} className={`w-full flex items-center mb-4 transition-all duration-200 rounded-xl ${isSidebarOpen ? 'space-x-3 p-2 hover:bg-emerald-800/50' : 'justify-center p-0 hover:scale-105'} ${activeTab === 'profil' ? 'bg-emerald-800 ring-1 ring-emerald-600 shadow-md' : ''}`} title="Klik untuk melihat Profil Saya">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner border-2 shrink-0 ${activeTab === 'profil' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-700 text-white border-emerald-600'}`}>{getInitials(displayName)}</div>
            {isSidebarOpen && (<div className="overflow-hidden animate-in fade-in duration-300 text-left"><p className={`text-sm font-bold truncate w-36 ${activeTab === 'profil' ? 'text-white' : 'text-emerald-50'}`}>{displayName}</p><p className="text-[10px] text-emerald-300 truncate w-36 font-medium tracking-wide">Komunikator Lapangan</p></div>)}
          </button>
          <div className="space-y-2">
              <button onClick={toggleOffline} className={`w-full flex items-center transition-all duration-200 rounded-lg shadow-sm border ${isSidebarOpen ? 'justify-start px-3 py-2 space-x-2' : 'justify-center p-2'} ${isOffline ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' : 'bg-emerald-800/50 border-emerald-700 text-emerald-100 hover:bg-emerald-800'}`} title={isOffline ? "Mode Luring Aktif" : "Mode Daring Aktif"}>
                {isOffline ? <WifiOff size={16} className="shrink-0"/> : <Wifi size={16} className="shrink-0"/>}
                {isSidebarOpen && <span className="text-xs font-bold whitespace-nowrap">{isOffline ? 'MODE LURING' : 'MODE DARING'}</span>}
              </button>
              <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center transition-all duration-200 rounded-lg hover:bg-red-900/40 text-emerald-300 hover:text-red-200 ${isSidebarOpen ? 'justify-start px-3 py-2 space-x-2' : 'justify-center p-2'} `} title="Keluar Aplikasi"><LogOut size={16} className="shrink-0"/>{isSidebarOpen && <span className="text-xs font-medium whitespace-nowrap">Keluar</span>}</button>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* HEADER: Z-INDEX 1000 */}
        <header className="bg-white/90 backdrop-blur-md h-16 border-b border-slate-200 sticky top-0 z-[1000] px-4 md:px-6 shadow-sm transition-all duration-300 shrink-0">
          <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
            <div className={`flex items-center transition-all duration-300 ${showMobileSearch ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-3 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 p-2 rounded-full transition-colors"><Menu size={20} /></button>
              <div><h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{title}</h2><p className="text-[10px] text-slate-400 font-medium hidden sm:block">{subtitle}</p></div>
            </div>

            <div className={`flex items-center ${showMobileSearch ? 'w-full' : ''} justify-end space-x-2 md:space-x-4`}>
              {!showMobileSearch && (<button onClick={() => setShowMobileSearch(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Search size={20} /></button>)}
              <div className={`${showMobileSearch ? 'flex w-full animate-in fade-in slide-in-from-right duration-200' : 'hidden md:flex'} relative items-center`}>
                <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none"/><input type="text" placeholder="Cari data lahan..." className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-emerald-300 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 w-full md:w-64 transition-all duration-300 shadow-inner" autoFocus={showMobileSearch}/>{showMobileSearch && <button onClick={() => setShowMobileSearch(false)} className="ml-2 p-2 text-slate-400"><X size={20} /></button>}
              </div>

              <div className={`${showMobileSearch ? 'hidden' : 'flex'} items-center space-x-3`}>
                
                {/* Antrian Upload (Hanya muncul jika ada antrian) */}
                {offlineQueueCount > 0 && (
                    <button onClick={onSync} disabled={isOffline} title="Klik untuk Sinkronisasi" className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border shadow-sm transition-all active:scale-95 ${isOffline ? 'bg-amber-100 text-amber-700 border-amber-200 cursor-help' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 cursor-pointer animate-pulse'}`}>
                        <UploadCloud size={14} /><span>{offlineQueueCount} Pending</span>
                    </button>
                )}

                {/* Indikator Status (Kecil) - Agar tidak redundant teksnya */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-sm cursor-help ${isOffline ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`} title={isOffline ? "Status: Offline" : "Status: Online"}>
                  {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
                </div>

                <div className="relative" ref={notifRef}>
                    <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); if(!showNotifDropdown) markAsRead(); }} className={`relative p-2 rounded-full transition-colors ${showNotifDropdown ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                    </button>
                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* (Isi Notifikasi Sama) */}
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pemberitahuan</h3><button className="text-[10px] text-emerald-600 hover:underline">Tandai dibaca</button></div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (<div className="p-6 text-center"><Bell size={24} className="mx-auto text-slate-200 mb-2"/><p className="text-xs text-slate-400">Belum ada notifikasi baru</p></div>) : (notifications.map((notif) => (<div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}><div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.type === 'warning' ? 'bg-amber-100' : notif.type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'}`}>{getNotifIcon(notif.type)}</div><div><p className="text-sm font-bold text-slate-800 leading-tight">{notif.title}</p><p className="text-xs text-slate-500 mt-1 leading-snug">{notif.message}</p><p className="text-[10px] text-slate-300 mt-2">{new Date(notif.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p></div></div>)))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* --- SYSTEM STATUS BAR (OFFLINE BANNER) --- */}
        {/* Banner statis di atas konten, mendorong konten ke bawah (tidak menutupi apapun) */}
        {isOffline && (
            <div className="w-full bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center space-x-2 animate-in slide-in-from-top-2 duration-300 shrink-0 z-[900]">
                <WifiOff size={14} className="text-amber-600 animate-pulse"/>
                <span className="text-xs font-bold text-amber-700">Mode Offline: Data disimpan di perangkat.</span>
            </div>
        )}

        {/* MAIN PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 p-0 md:p-8">
            {children}
        </div>

        {/* QUICK SCAN FAB */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[1500]">
            <button onClick={() => setIsScannerOpen(true)} className="group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-90 border-4 border-white/20" title="Quick Scan QR">
                <ScanLine size={28} className="group-hover:scale-110 transition-transform"/><span className="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl hidden md:block">Scan Kartu</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default MainLayout;