import L from 'leaflet';

// Gunakan path relatif ke node_modules untuk bypass alias Vite
import '../../node_modules/leaflet-draw/dist/leaflet.draw.js';
import '../../node_modules/leaflet-draw/dist/leaflet.draw.css';

// Paksa export default
export default L.Control.Draw;