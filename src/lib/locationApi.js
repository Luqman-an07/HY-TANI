// Menggunakan API Wilayah Indonesia (Emsifa)
const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export const getProvinces = async () => {
  try {
    const response = await fetch(`${BASE_URL}/provinces.json`);
    return await response.json();
  } catch (error) {
    console.error("Gagal fetch provinsi", error);
    return [];
  }
};

export const getRegencies = async (provinceId) => {
  try {
    const response = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const getDistricts = async (regencyId) => { // Kecamatan
  try {
    const response = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const getVillages = async (districtId) => { // Desa
  try {
    const response = await fetch(`${BASE_URL}/villages/${districtId}.json`);
    return await response.json();
  } catch (error) {
    return [];
  }
};

// --- AUTO GEOCODING (OpenStreetMap) ---
// Mendapatkan Lat/Lng otomatis berdasarkan nama Desa + Kecamatan + Kab
export const getCoordinates = async (village, district, regency, province) => {
    try {
        const query = `${village}, ${district}, ${regency}, ${province}, Indonesia`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error", error);
        return null;
    }
};