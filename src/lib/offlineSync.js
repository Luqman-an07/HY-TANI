import { supabase } from './supabaseClient';

const QUEUE_KEY = 'hytani_offline_queue';

// --- 1. GET QUEUE (Fungsi yang hilang) ---
export const getQueue = () => {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    console.error("Error reading queue", e);
    return [];
  }
};

// --- 2. ADD TO QUEUE ---
export const addToQueue = (action, payload) => {
  const queue = getQueue();
  const newItem = { 
    id: Date.now(), // ID unik untuk antrian
    action, 
    payload, 
    timestamp: new Date().toISOString() 
  };
  
  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue.length;
};

// --- 3. PROCESS QUEUE (SYNC) ---
export const processOfflineQueue = async () => {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let successCount = 0;
  const failedItems = [];

  for (const item of queue) {
    try {
      const { action, payload } = item;
      let error = null;

      // Hapus ID temp jika ada (untuk INSERT) agar digenerate DB
      // Tapi untuk UPDATE/DELETE kita butuh ID aslinya
      const { polygon_data, ...restPayload } = payload; 
      
      // Sanitasi payload untuk DB (sesuaikan nama kolom)
      const dbPayload = { ...restPayload };
      if (polygon_data) dbPayload.polygon_data = polygon_data;

      if (action === 'INSERT') {
        // Hapus ID jika itu ID timestamp (biasanya angka besar)
        if (typeof dbPayload.id === 'number' && dbPayload.id > 1000000000000) {
            delete dbPayload.id; 
        }
        const { error: err } = await supabase.from('farms').insert([dbPayload]);
        error = err;
      } 
      else if (action === 'UPDATE') {
        const { id, ...updateData } = dbPayload;
        const { error: err } = await supabase.from('farms').update(updateData).eq('id', id);
        error = err;
      } 
      else if (action === 'DELETE') {
        const { error: err } = await supabase.from('farms').delete().eq('id', dbPayload.id);
        error = err;
      }

      if (error) throw error;
      successCount++;

    } catch (err) {
      console.error("Gagal sync item:", item, err);
      // Item gagal tetap disimpan untuk dicoba lagi nanti
      failedItems.push(item);
    }
  }

  // Simpan sisa item yang gagal (jika ada) kembali ke localStorage
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failedItems));
  
  return successCount;
};

// --- 4. CLEAR QUEUE (Opsional) ---
export const clearQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
};