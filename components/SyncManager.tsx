"use client";

import { useState, useEffect, useCallback } from "react";
import { CloudArrowUp, WifiHigh, WifiSlash, CheckCircle, ArrowsCounterClockwise } from "@phosphor-icons/react";

export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const cekDataOffline = useCallback(() => {
    const savedData = localStorage.getItem("tarbiyahtech_offline_queue");
    if (savedData) setPendingItems(JSON.parse(savedData));
    else setPendingItems([]);
  }, []);

  const handleSync = useCallback(async () => {
    const data = JSON.parse(localStorage.getItem("tarbiyahtech_offline_queue") || "[]");
    if (data.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    for (const item of data) { await new Promise(resolve => setTimeout(resolve, 800)); }
    localStorage.removeItem("tarbiyahtech_offline_queue");
    cekDataOffline();
    setIsSyncing(false);
  }, [cekDataOffline]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => { setIsOnline(true); handleSync(); };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("storage_updated", cekDataOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("storage_updated", cekDataOffline);
    };
  }, [cekDataOffline, handleSync]);

  return (
    <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
      {/* Indikator Internet */}
      {isOnline ? (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest"><WifiHigh size={14} weight="bold"/> Online</span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse"><WifiSlash size={14} weight="bold"/> Offline</span>
      )}

      {/* Teks Status & Tombol (Hanya Muncul Jika Ada Data) */}
      {pendingItems.length > 0 ? (
        <>
          <div className="w-px h-3 bg-slate-300"></div>
          <button 
            onClick={handleSync} disabled={isSyncing || !isOnline}
            className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-all"
          >
            {isSyncing ? <ArrowsCounterClockwise size={14} className="animate-spin" /> : <CloudArrowUp size={14} weight="bold" />}
            {pendingItems.length} Data
          </button>
        </>
      ) : (
        <>
          <div className="w-px h-3 bg-slate-300"></div>
          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <CheckCircle size={14} weight="fill"/> Tersinkron
          </span>
        </>
      )}
    </div>
  );
}