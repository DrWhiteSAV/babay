import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { bgMusics, menuMusic } from "../hooks/useAudio";

// Persisted progress key — survives page reload (localStorage, not sessionStorage)
const PROGRESS_KEY = "babai_preload_progress_v2";
const DONE_KEY = "babai_assets_preloaded_v2";

interface PreloadState {
  active: boolean;
  pct: number;
  loadedBytes: number;
  totalBytes: number;
  currentLabel: string;
}

const PreloadContext = createContext<PreloadState>({
  active: false,
  pct: 0,
  loadedBytes: 0,
  totalBytes: 0,
  currentLabel: "",
});

export function usePreloadState() {
  return useContext(PreloadContext);
}

/** Returns bytes loaded; 0 if already cached or on error */
async function cacheAsset(url: string): Promise<number> {
  try {
    const cache = await caches.open("babai-assets-v2");
    const existing = await cache.match(url);
    if (existing) {
      // Already in cache — count as done
      const cl = existing.headers.get("content-length");
      return cl ? parseInt(cl) : 500_000;
    }
    const resp = await fetch(url, { cache: "force-cache" });
    if (!resp.ok) return 0;
    const cl = resp.headers.get("content-length");
    const bytes = cl ? parseInt(cl) : 500_000;
    await cache.put(url, resp);
    return bytes;
  } catch {
    return 0;
  }
}

/** Read list of already-cached URLs from Cache API */
async function getCachedUrls(): Promise<Set<string>> {
  try {
    const cache = await caches.open("babai-assets-v2");
    const keys = await cache.keys();
    return new Set(keys.map(r => r.url));
  } catch {
    return new Set();
  }
}

export function AssetPreloaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreloadState>({
    active: false,
    pct: 0,
    loadedBytes: 0,
    totalBytes: 0,
    currentLabel: "",
  });
  const doneRef = useRef(false);

  useEffect(() => {
    // Fully done flag (all assets cached)
    if (sessionStorage.getItem(DONE_KEY) === "1") return;
    if (!("caches" in window)) {
      sessionStorage.setItem(DONE_KEY, "1");
      return;
    }
    startPreload();
  }, []);

  const startPreload = async () => {
    setState(s => ({ ...s, active: true, currentLabel: "Подготовка..." }));

    // Fetch asset list from DB
    const [bgRes, videoRes, audioRes] = await Promise.all([
      supabase.from("page_backgrounds").select("url, page_path"),
      supabase.from("video_cutscenes").select("url, orientation"),
      supabase.from("audio_settings").select("value, label"),
    ]);

    const list: { url: string; label: string }[] = [];

    [...bgMusics, menuMusic].forEach(url =>
      list.push({ url, label: "🎵 Музыка" })
    );
    (bgRes.data || []).forEach(row => {
      if (row.url) list.push({ url: row.url, label: "🖼 Фон" });
    });
    (videoRes.data || []).forEach(row => {
      if (row.url) list.push({ url: row.url, label: "🎬 Видео" });
    });
    (audioRes.data || []).forEach(row => {
      if (row.value?.startsWith("http"))
        list.push({ url: row.value, label: `🔊 ${row.label || "Звук"}` });
    });

    const unique = Array.from(new Map(list.map(a => [a.url, a])).values());
    if (unique.length === 0) {
      sessionStorage.setItem(DONE_KEY, "1");
      setState(s => ({ ...s, active: false }));
      return;
    }

    // Estimated total size
    const estimatedTotal = unique.reduce((acc, a) => {
      if (a.url.match(/\.(mp4|webm|mov)/i)) return acc + 2_000_000;
      if (a.url.match(/\.(mp3|ogg|wav)/i)) return acc + 500_000;
      return acc + 200_000;
    }, 0);

    setState(s => ({ ...s, totalBytes: estimatedTotal }));

    // ── Resume from interrupted point ──────────────────────────────────────
    // Check which URLs are already in the Cache API
    const cachedUrls = await getCachedUrls();

    // Restore saved byte progress from last session
    let savedBytes = 0;
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (saved) savedBytes = parseInt(saved) || 0;
    } catch { /**/ }

    let done = 0;
    let bytesAcc = savedBytes;

    for (const asset of unique) {
      if (doneRef.current) break;

      // Skip assets already in cache (from previous interrupted session)
      if (cachedUrls.has(asset.url) || cachedUrls.has(new URL(asset.url, location.origin).href)) {
        done += 1;
        bytesAcc += estimatedTotal / unique.length;
        const pct = Math.round((done / unique.length) * 100);
        setState(s => ({
          ...s,
          pct,
          loadedBytes: Math.min(bytesAcc, estimatedTotal),
          currentLabel: asset.label,
        }));
        continue;
      }

      setState(s => ({ ...s, currentLabel: asset.label }));
      const bytes = await cacheAsset(asset.url);
      bytesAcc += bytes || estimatedTotal / unique.length;
      done += 1;
      const pct = Math.round((done / unique.length) * 100);

      // Persist progress so we can resume if interrupted
      try { localStorage.setItem(PROGRESS_KEY, String(bytesAcc)); } catch { /**/ }

      setState(s => ({
        ...s,
        pct,
        loadedBytes: Math.min(bytesAcc, estimatedTotal),
      }));
    }

    // All done — clean up progress key, set done flag
    try { localStorage.removeItem(PROGRESS_KEY); } catch { /**/ }
    sessionStorage.setItem(DONE_KEY, "1");

    setState(s => ({ ...s, pct: 100 }));
    setTimeout(() => setState(s => ({ ...s, active: false })), 1200);
  };

  return (
    <PreloadContext.Provider value={state}>
      {children}
    </PreloadContext.Provider>
  );
}
