import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Sprout, AlertCircle, DollarSign, 
  Scale, Activity, FileText, RefreshCw 
} from 'lucide-react';

// --- KOMPONEN: MARKET TICKER (INFO HARGA PASAR) ---
const MarketTicker = () => {
  // Simulasi Data Harga Pasar (Bisa diganti API real nanti)
  const marketData = [
    { label: "Gabah Kering Panen (GKP)", price: 7200, change: 150, status: 'up' },
    { label: "Gabah Kering Giling (GKG)", price: 8600, change: -50, status: 'down' },
    { label: "Beras Medium (Pasar)", price: 13500, change: 0, status: 'stable' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center uppercase tracking-wider">
          <DollarSign size={16} className="mr-2 text-emerald-600"/> Monitor Harga Pasar (Live)
        </h3>
        <span className="text-[10px] text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-full">
          <RefreshCw size={10} className="mr-1"/> Update: {new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {marketData.map((item, idx) => (
          <div key={idx} className={`pt-4 md:pt-0 ${idx > 0 ? 'md:pl-4' : ''}`}>
            <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold text-slate-800">Rp {item.price.toLocaleString('id-ID')}</span>
              <div className={`flex items-center text-xs font-bold ${
                item.status === 'up' ? 'text-emerald-600 bg-emerald-50' : 
                item.status === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'
              } px-2 py-1 rounded-lg`}>
                {item.status === 'up' && <TrendingUp size={14} className="mr-1"/>}
                {item.status === 'down' && <TrendingDown size={14} className="mr-1"/>}
                {item.status === 'stable' && <Minus size={14} className="mr-1"/>}
                {item.status === 'stable' ? 'Stabil' : `Rp ${Math.abs(item.change)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DataView = ({ farms }) => {

  // --- 1. DATA PROCESSING ENGINE ---
  const analytics = useMemo(() => {
    let totalArea = 0;
    let totalYield = 0;
    let totalRevenue = 0;
    let totalNDVI = 0;
    
    let statusCount = { sehat: 0, waspada: 0, bahaya: 0 };

    const processedFarms = farms.map(farm => {
      // Parsing Luas
      const sizeVal = parseFloat(farm.size.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
      // Parsing Prediksi
      const yieldVal = parseFloat(farm.prediction.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
      // Parsing Uang
      const moneyRaw = farm.value.replace(',', '.').replace(/[^0-9.]/g, '');
      const revenueVal = parseFloat(moneyRaw) * 1000000 || 0;
      // Parsing NDVI
      const ndviVal = parseFloat(farm.ndvi) || 0;

      // Aggregates
      totalArea += sizeVal;
      totalYield += yieldVal;
      totalRevenue += revenueVal;
      totalNDVI += ndviVal;
      
      if (statusCount[farm.status] !== undefined) {
        statusCount[farm.status]++;
      }

      return {
        name: farm.name,
        shortName: farm.name.split(' - ')[0] || farm.name,
        farmer: farm.farmer,
        size: sizeVal,
        yield: yieldVal,
        revenue: revenueVal,
        ndvi: ndviVal,
        status: farm.status
      };
    });

    return {
      totalArea: totalArea.toFixed(1),
      totalYield: totalYield.toFixed(1),
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
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
      
      {/* SECTION 0: MARKET MONITOR (BARU) */}
      <MarketTicker />

      {/* SECTION 1: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Luas Lahan" 
          value={`${analytics.totalArea} Ha`} 
          icon={<Scale className="text-blue-500" />} 
          bg="bg-blue-50" border="border-blue-100"
          desc="Akumulasi seluruh blok"
        />
        <KpiCard 
          title="Estimasi Panen" 
          value={`${analytics.totalYield} Ton`} 
          icon={<Sprout className="text-emerald-500" />} 
          bg="bg-emerald-50" border="border-emerald-100"
          desc="Potensi hasil musim ini"
        />
        <KpiCard 
          title="Valuasi Ekonomi" 
          value={`Rp ${analytics.totalRevenue} Jt`} 
          icon={<DollarSign className="text-amber-500" />} 
          bg="bg-amber-50" border="border-amber-100"
          desc="Estimasi nilai pasar gabah"
        />
        <KpiCard 
          title="Rata-rata NDVI" 
          value={analytics.avgNDVI} 
          icon={<Activity className="text-purple-500" />} 
          bg="bg-purple-50" border="border-purple-100"
          desc="Indeks kesehatan vegetasi"
        />
      </div>

      {/* SECTION 2: GRAFIK VISUALISASI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART A: PIE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-slate-700 font-bold mb-4 w-full text-left flex items-center">
            <AlertCircle size={18} className="mr-2 text-slate-400"/> Status Kesehatan Lahan
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART B: BAR & LINE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-700 font-bold mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-slate-400"/> Produktivitas & Kualitas (NDVI)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortName" tick={{fontSize: 10}} interval={0} />
                <YAxis yAxisId="left" orientation="left" stroke="#64748b" fontSize={10} label={{ value: 'Ton', angle: -90, position: 'insideLeft' }}/>
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={[0, 1]} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="yield" name="Panen (Ton)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="right" dataKey="ndvi" name="Kualitas (NDVI)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: AREA CHART */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="text-slate-700 font-bold mb-4 flex items-center">
            <Activity size={18} className="mr-2 text-slate-400"/> Tren Kepadatan Hijau (NDVI) per Petani
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="farmer" tick={{fontSize: 10}} />
                <YAxis domain={[0, 1]} fontSize={10}/>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Area type="monotone" dataKey="ndvi" stroke="#10b981" fillOpacity={1} fill="url(#colorNdvi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* SECTION 4: TABEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-700 flex items-center">
            <FileText size={18} className="mr-2 text-slate-400"/> Data Tabular
          </h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">{farms.length} Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-3">Nama Petani</th>
                <th className="px-6 py-3">Lokasi Lahan</th>
                <th className="px-6 py-3 text-right">Luas (Ha)</th>
                <th className="px-6 py-3 text-right">Prediksi (Ton)</th>
                <th className="px-6 py-3 text-center">NDVI</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-bold text-slate-700">{item.farmer}</td>
                  <td className="px-6 py-3 text-slate-500">{item.name}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-600">{item.size}</td>
                  <td className="px-6 py-3 text-right font-mono text-emerald-600 font-bold">{item.yield}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.ndvi >= 0.7 ? 'bg-emerald-100 text-emerald-700' : item.ndvi >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {item.ndvi}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'sehat' ? 'bg-emerald-50 text-emerald-700' : item.status === 'waspada' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'sehat' ? 'bg-emerald-500' : item.status === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                      {item.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const KpiCard = ({ title, value, icon, bg, border, desc }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-sm border ${border} flex items-start space-x-4 hover:shadow-md transition-all`}>
    <div className={`p-3 rounded-xl ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
    </div>
  </div>
);

export default DataView;