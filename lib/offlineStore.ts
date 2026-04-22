// utils/offlineStore.ts

export const saveDataSmart = async (endpoint: string, payload: any) => {
  const payloadWithMeta = {
    endpoint,
    payload,
    timestamp: new Date().toISOString(),
    id: `offline-${Date.now()}`
  };

  if (navigator.onLine) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) return { success: true, mode: 'online' };
    } catch (e) {
      // Jika fetch gagal (misal server down tapi internet nyala), lempar ke offline storage
    }
  }

  // JIKA OFFLINE atau FETCH GAGAL
  const existingData = JSON.parse(localStorage.getItem("tarbiyahtech_offline_queue") || "[]");
  existingData.push(payloadWithMeta);
  localStorage.setItem("tarbiyahtech_offline_queue", JSON.stringify(existingData));
  
  // Beritahu sistem bahwa ada data baru untuk memicu refresh di SyncManager
  window.dispatchEvent(new Event("storage_updated"));
  
  return { success: true, mode: 'offline' };
};