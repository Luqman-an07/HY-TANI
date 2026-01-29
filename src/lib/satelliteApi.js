// API KEY AGROMONITORING (Gunakan Environment Variable di Production)
const API_KEY = '26e605f6ab91625ce0f5ed3cf7c2abff'; 

// PENTING: Gunakan HTTPS agar tidak kena 'Mixed Content Error' saat deploy
const BASE_URL = 'https://api.agromonitoring.com/agro/1.0';

// Helper: Membuat kotak GeoJSON di sekitar titik
const createGeoJSONSquare = (lat, lng) => {
    const offset = 0.0005; // +/- 50 meter
    return {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: [[
                [lng - offset, lat - offset],
                [lng + offset, lat - offset],
                [lng + offset, lat + offset],
                [lng - offset, lat + offset],
                [lng - offset, lat - offset] // Menutup loop (titik awal = akhir)
            ]]
        }
    };
};

// 1. DAFTARKAN LAHAN KE SATELIT
export const registerPolygonToSatellite = async (name, lat, lng) => {
    const geoJson = createGeoJSONSquare(lat, lng);
    
    try {
        const response = await fetch(`${BASE_URL}/polygons?appid=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                geo_json: geoJson
            })
        });

        // Handle jika polygon gagal dibuat (misal duplikat atau server error)
        if (!response.ok) {
            const errData = await response.json();
            console.warn("Info Satelit:", errData.message || "Gagal register polygon");
            return null; 
        }
        
        const data = await response.json();
        return data.id; // ID ini disimpan ke database (external_polygon_id)
    } catch (error) {
        console.error("Satellite Connection Error:", error);
        return null;
    }
};

// 2. AMBIL DATA NDVI TERBARU + TIMESTAMP
export const getSatelliteNDVI = async (polygonId) => {
    if (!polygonId) return { ndvi: 0, dt: null }; // Return object default

    try {
        const end = Math.floor(Date.now() / 1000); 
        const start = end - (30 * 24 * 60 * 60);   

        const url = `${BASE_URL}/ndvi/history?polyid=${polygonId}&start=${start}&end=${end}&appid=${API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) return { ndvi: 0, dt: null };

        const data = await response.json();
        
        if (data && data.length > 0) {
            const sortedData = data.sort((a, b) => b.dt - a.dt);
            const latestData = sortedData[0];
            
            return {
                ndvi: parseFloat(latestData.data.mean).toFixed(2),
                dt: latestData.dt // Unix Timestamp dari satelit
            };
        }
        
        return { ndvi: 0, dt: null };
    } catch (error) {
        console.error("Gagal mengambil NDVI:", error);
        return { ndvi: 0, dt: null };
    }
};