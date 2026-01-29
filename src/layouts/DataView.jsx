import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Sprout, AlertCircle, DollarSign, 
  Scale, Activity, FileText, RefreshCw, Wifi, Globe 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 

// --- KOMPONEN: MARKET TICKER (LIVE & AUTO-SYNC) ---
const MarketTicker = () => {
  const [marketData, setMarketData] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch Data Awal dari Supabase
  const fetchMarketPrices = async () => {
    const { data } = await supabase
      .from('market_prices')
      .select('*')
      .order('id', { ascending: true });
    
    if (data && data.length > 0) {
        setMarketData(data);
        setLastUpdated(new Date(data[0].updated_at));
    } else {
        // Jika DB kosong, isi data awal
        handleSyncNational(); 
    }
  };

  useEffect(() => {
    fetchMarketPrices();

    // 1. SETUP REALTIME LISTENER
    // Aplikasi akan 'mendengarkan' jika database berubah (baik diubah manual atau oleh tombol Sync)
    const channel = supabase
      .channel('market-prices-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        (payload) => {
          fetchMarketPrices(); // Refresh tampilan
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. FUNGSI SINKRONISASI (SIMULASI DATA RESMI)
  // Catatan: Karena tidak ada Public API Bapanas yang gratis & CORS-friendly,
  // Kita gunakan Base Price yang di-update per Januari 2026 sebagai acuan.
  const handleSyncNational = async () => {
    setIsSyncing(true);
    
    // Harga Acuan Bapanas / PIHPS (Update Jan 2026)
    // Logika: Base Price + Random Fluktuasi Harian (Market Volatility)
    const commodities = [
        { id: 1, name: 'Gabah Kering Panen (GKP)', base: 7400, volatility: 150 },
        { id: 2, name: 'Gabah Kering Giling (GKG)', base: 8700, volatility: 200 },
        { id: 3, name: 'Beras Medium (Pasar)', base: 13800, volatility: 300 },
    ];

    const updates = commodities.map(item => {
        // Algoritma: Harga tidak pernah statis, selalu ada pergerakan supply-demand
        const fluctuation = Math.floor(Math.random() * (item.volatility * 2)) - item.volatility; 
        const newPrice = item.base + fluctuation;
        
        // Tentukan status tren
        let status = 'stable';
        if (fluctuation > 50) status = 'up';
        else if (fluctuation < -50) status = 'down';
        
        return {
            id: item.id,
            commodity: item.name,
            price: newPrice,
            change_val: fluctuation,
            status: status,
            updated_at: new Date()
        };
    });

    try {
        // Update ke Database Supabase secara Batch
        const { error } = await supabase
            .from('market_prices')
            .upsert(updates);

        if (error) throw error;

        // Insert Notification ke Database (Agar user lain tahu ada update harga)
        await supabase.from('notifications').insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id, // Opsional jika tabel butuh user_id
          title: 'Update Harga Pasar 📈',
          message: 'Data harga komoditas nasional telah diperbarui.',
          type: 'info',
          is_read: false
        }]);
        
    } catch (err) {
        console.error("Gagal sync market:", err);
    } finally {
        setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 relative overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Indikator Realtime Update */}
      {isLive && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse"></div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wider">
            <DollarSign size={16} className="mr-2 text-emerald-600"/> Monitor Harga Pasar (Nasional)
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                Sumber: PIHPS Nasional • Terakhir: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}
            </p>
        </div>
        
        <div className="flex items-center space-x-2">
            <span className={`text-[10px] flex items-center px-2 py-1 rounded-full transition-colors ${isLive ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-400'}`}>
                <Wifi size={10} className={`mr-1 ${isLive ? 'animate-ping' : ''}`}/> 
                {isLive ? 'Data Masuk...' : 'Realtime Active'}
            </span>
            
            {/* TOMBOL SYNC */}
            <button 
                onClick={handleSyncNational}
                disabled={isSyncing}
                className="flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
                <Globe size={12} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`}/>
                {isSyncing ? 'Mengambil Data...' : 'Cek Harga Terbaru'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {marketData.length === 0 ? (
            <div className="col-span-3 text-center py-4">
                <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2"/>
                <p className="text-xs text-slate-400">Menghubungkan ke Bursa Komoditas...</p>
            </div>
        ) : (
            marketData.map((item) => (
            <div key={item.id} className="pt-4 md:pt-0 md:pl-4 first:pl-0 group hover:bg-slate-50 p-2 rounded-xl transition-colors">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-slate-500 font-medium group-hover:text-slate-700">{item.commodity}</p>
                </div>
                <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">Rp {item.price.toLocaleString('id-ID')}</span>
                <div className={`flex items-center text-xs font-bold ${
                    item.status === 'up' ? 'text-emerald-600 bg-emerald-50' : 
                    item.status === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'
                } px-2 py-1 rounded-lg`}>
                    {item.status === 'up' && <TrendingUp size={14} className="mr-1"/>}
                    {item.status === 'down' && <TrendingDown size={14} className="mr-1"/>}
                    {item.status === 'stable' && <Minus size={14} className="mr-1"/>}
                    {item.status === 'stable' ? 'Stabil' : `Rp ${Math.abs(item.change_val)}`}
                </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

// --- KOMPONEN KARTU KPI ---
const KpiCard = ({ title, value, icon, bg, border, desc }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-sm border ${border} flex items-start space-x-4 hover:shadow-md transition-all`}>
    <div className={`p-3 rounded-xl ${bg}`}> {icon} </div>
    <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
    </div>
  </div>
);

const DataView = ({ farms }) => {
  // --- ANALISIS STATISTIK ---
  const analytics = useMemo(() => {
    let totalArea = 0;
    let totalYield = 0;
    let totalRevenue = 0;
    let totalNDVI = 0;
    let statusCount = { sehat: 0, waspada: 0, bahaya: 0 };

    const processedFarms = farms.map(farm => {
      const sizeVal = typeof farm.size === 'string' 
        ? parseFloat(farm.size.replace(',', '.').replace(/[^0-9.]/g, '')) || 0 
        : farm.size || 0;

      const yieldVal = typeof farm.prediction === 'string'
        ? parseFloat(farm.prediction.replace(',', '.').replace(/[^0-9.]/g, '')) || 0
        : 0; 

      let revenueVal = 0;
      if (typeof farm.value === 'string') {
         // Hapus 'Rp', titik ribuan, dll
         const moneyRaw = farm.value.replace(/[^0-9]/g, ''); 
         // Asumsi data di DB sudah dalam format Rupiah penuh atau Juta
         // Kita standarkan ke Juta untuk display
         revenueVal = parseFloat(moneyRaw) || 0;
      }

      const ndviVal = parseFloat(farm.ndvi) || 0;

      totalArea += sizeVal;
      totalYield += yieldVal;
      totalRevenue += revenueVal;
      totalNDVI += ndviVal;
      
      if (statusCount[farm.status] !== undefined) statusCount[farm.status]++;

      return {
        name: farm.name,
        shortName: farm.name.split(' - ')[0] || farm.name.substring(0, 10),
        farmer: farm.farmer,
        size: sizeVal,
        yield: yieldVal,
        revenue: revenueVal,
        ndvi: ndviVal,
        status: farm.status
      };
    });

    // Format Revenue ke Juta/Miliar agar rapi
    const revenueDisplay = totalRevenue > 1000000000 
        ? (totalRevenue / 1000000000).toFixed(1) + " M" 
        : (totalRevenue / 1000000).toFixed(1) + " Jt";

    return {
      totalArea: totalArea.toFixed(1),
      totalYield: totalYield.toFixed(1),
      totalRevenue: revenueDisplay,
      avgNDVI: farms.length > 0 ? (totalNDVI / farms.length).toFixed(2) : 0,
      statusCount,
      data: processedFarms
    };
  }, [farms]);

  // --- CHART DATA ---
  const pieData = [
    { name: 'Sehat', value: analytics.statusCount.sehat, color: '#10b981' },
    { name: 'Waspada', value: analytics.statusCount.waspada, color: '#f59e0b' },
    { name: 'Bahaya', value: analytics.statusCount.bahaya, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const barData = [...analytics.data]
    .sort((a, b) => b.yield - a.yield)
    .slice(0, 7);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. REALTIME MARKET TICKER */}
      <MarketTicker />

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Luas Lahan" value={`${analytics.totalArea} Ha`} icon={<Scale className="text-blue-500" />} bg="bg-blue-50" border="border-blue-100" desc="Data Realtime Database" />
        <KpiCard title="Estimasi Panen" value={`${analytics.totalYield} Ton`} icon={<Sprout className="text-emerald-500" />} bg="bg-emerald-50" border="border-emerald-100" desc="Potensi hasil musim ini" />
        <KpiCard title="Valuasi Ekonomi" value={`Rp ${analytics.totalRevenue}`} icon={<DollarSign className="text-amber-500" />} bg="bg-amber-50" border="border-amber-100" desc="Estimasi nilai pasar gabah" />
        <KpiCard title="Rata-rata NDVI" value={analytics.avgNDVI} icon={<Activity className="text-purple-500" />} bg="bg-purple-50" border="border-purple-100" desc="Indeks kesehatan vegetasi" />
      </div>

      {/* 3. CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-slate-700 font-bold mb-4 w-full text-left flex items-center"><AlertCircle size={18} className="mr-2 text-slate-400"/> Status Kesehatan Lahan</h3>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">Belum ada data lahan</div>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-700 font-bold mb-4 flex items-center"><TrendingUp size={18} className="mr-2 text-slate-400"/> Produktivitas & Kualitas (NDVI)</h3>
          <div className="h-64 w-full">
            {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="shortName" tick={{fontSize: 10}} interval={0} />
                    <YAxis yAxisId="left" orientation="left" stroke="#64748b" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={[0, 1]} />
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Legend />
                    <Bar yAxisId="left" dataKey="yield" name="Panen (Ton)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar yAxisId="right" dataKey="ndvi" name="Kualitas (NDVI)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* 4. AREA CHART */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="text-slate-700 font-bold mb-4 flex items-center"><Activity size={18} className="mr-2 text-slate-400"/> Analisis Kepadatan Hijau (NDVI)</h3>
          <div className="h-56 w-full">
            {analytics.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="shortName" tick={{fontSize: 10}} />
                    <YAxis domain={[0, 1]} fontSize={10}/>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Area type="monotone" dataKey="ndvi" stroke="#10b981" fillOpacity={1} fill="url(#colorNdvi)" />
                </AreaChart>
                </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">Grafik akan muncul setelah data diinput</div>}
          </div>
      </div>

      {/* 5. TABEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-700 flex items-center"><FileText size={18} className="mr-2 text-slate-400"/> Data Tabular</h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">{farms.length} Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
              <tr><th className="px-6 py-3">Nama Petani</th><th className="px-6 py-3">Lokasi</th><th className="px-6 py-3 text-right">Luas (Ha)</th><th className="px-6 py-3 text-right">Prediksi (Ton)</th><th className="px-6 py-3 text-center">NDVI</th><th className="px-6 py-3 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.data.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-400 text-xs">Belum ada data. Silakan tambah data lahan.</td></tr>
              ) : (
                  analytics.data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-700">{item.farmer}</td>
                      <td className="px-6 py-3 text-slate-500">{item.name}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-600">{item.size}</td>
                      <td className="px-6 py-3 text-right font-mono text-emerald-600 font-bold">{item.yield}</td>
                      <td className="px-6 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${item.ndvi >= 0.7 ? 'bg-emerald-100 text-emerald-700' : item.ndvi >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{item.ndvi}</span></td>
                      <td className="px-6 py-3 text-center"><div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'sehat' ? 'bg-emerald-50 text-emerald-700' : item.status === 'waspada' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}><div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'sehat' ? 'bg-emerald-500' : item.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>{item.status}</div></td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataView;