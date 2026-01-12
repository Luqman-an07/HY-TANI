// Fungsi Helper untuk plot grid (Visualisasi lahan)
export const generatePlots = (status) => {
  const plots = [];
  for (let i = 1; i <= 16; i++) {
    plots.push({
      id: i,
      score: status === 'sehat' ? (0.8 + Math.random() * 0.2).toFixed(2) 
             : status === 'waspada' ? (0.4 + Math.random() * 0.3).toFixed(2) 
             : (0.1 + Math.random() * 0.3).toFixed(2),
      type: status
    });
  }
  return plots;
};

// Helper untuk tanggal masa depan (YYYY-MM-DD)
const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Helper untuk tanggal masa lalu (YYYY-MM-DD)
const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// DATA DUMMY (Template Simulasi)
// Lokasi Lat/Lng diset 0 karena akan ditimpa otomatis oleh App.jsx sesuai lokasi Desa User
export const initialFarms = [
  {
    id: 1,
    farmer: "Pak Budi Santoso",
    contact: "0812-3456-7890",
    age: "45",
    joinDate: "2023-05-12", // Bergabung sejak 2023
    name: "Blok A - Sawah Utara",
    size: "1.2",
    lat: 0, 
    lng: 0,
    polygon: [], // KOSONGKAN agar auto-draw & bisa drag-drop
    status: "sehat",
    ndvi: "0.82",
    prediction: "6.5 Ton",
    value: "Rp 32.0 Juta",
    lastUpdate: "Hari ini, 09:00",
    
    // SIKLUS TANAM: Pertengahan (Vegetatif Maksimal)
    plantingDate: getPastDate(45), // Tanam 45 hari lalu
    harvestDate: getFutureDate(60), // Panen 60 hari lagi
    nextVisit: getFutureDate(7), // Jadwal rutin
    
    // Parameter Kalkulator
    waterScore: 100,
    fertScore: 100,
    pestScore: 100,
    plots: generatePlots('sehat')
  },
  {
    id: 2,
    farmer: "Ibu Siti Aminah",
    contact: "0815-9876-5432",
    age: "52",
    joinDate: "2024-01-20",
    name: "Blok B - Sawah Tengah",
    size: "0.8",
    lat: 0,
    lng: 0,
    polygon: [],
    status: "waspada",
    ndvi: "0.55",
    prediction: "3.2 Ton",
    value: "Rp 15.0 Juta",
    lastUpdate: "Kemarin, 16:00",
    
    // SIKLUS TANAM: Fase Pematangan (Hampir Panen)
    plantingDate: getPastDate(85), 
    harvestDate: getFutureDate(20),
    nextVisit: getFutureDate(3), // Waspada = 3 Hari
    
    waterScore: 50, // Air kurang
    fertScore: 70,
    pestScore: 70,
    plots: generatePlots('waspada')
  },
  {
    id: 3,
    farmer: "Pak Asep Sunandar",
    contact: "0818-1234-5678",
    age: "38",
    joinDate: "2024-08-15",
    name: "Blok C - Tepi Sungai",
    size: "1.5",
    lat: 0,
    lng: 0,
    polygon: [],
    status: "bahaya",
    ndvi: "0.21",
    prediction: "Gagal",
    value: "Rp 0",
    lastUpdate: "2 Jam lalu",
    
    // SIKLUS TANAM: Baru Tanam (Vegetatif Awal)
    plantingDate: getPastDate(10), 
    harvestDate: getFutureDate(95),
    nextVisit: getFutureDate(1), // Bahaya = Besok
    
    waterScore: 20, // Kering
    fertScore: 40,
    pestScore: 10, // Hama Puso
    plots: generatePlots('bahaya')
  },
  {
    id: 4,
    farmer: "Kelompok Tani Makmur",
    contact: "0821-8888-9999",
    age: "40",
    joinDate: "2022-11-05",
    name: "Blok D - Lumbung Desa",
    size: "2.5",
    lat: 0,
    lng: 0,
    polygon: [],
    status: "sehat",
    ndvi: "0.79",
    prediction: "12 Ton",
    value: "Rp 60.0 Juta",
    lastUpdate: "Hari ini, 07:00",
    
    // SIKLUS TANAM: Baru Banget (Bibit)
    plantingDate: getPastDate(2), 
    harvestDate: getFutureDate(103),
    nextVisit: getFutureDate(14),
    
    waterScore: 100,
    fertScore: 100,
    pestScore: 100,
    plots: generatePlots('sehat')
  }
];