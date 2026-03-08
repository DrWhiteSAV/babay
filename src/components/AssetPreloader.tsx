import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { bgMusics, menuMusic } from "../hooks/useAudio";

const PRELOADED_KEY = "babai_assets_preloaded_v2";

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

async function cacheAsset(url: string): Promise<number> {
  try {
    const cache = await caches.open("babai-assets-v2");
    const existing = await cache.match(url);
    if (existing) {
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
    // Already cached this session — skip silently
    if (sessionStorage.getItem(PRELOADED_KEY) === "1") return;
    if (!("caches" in window)) {
      sessionStorage.setItem(PRELOADED_KEY, "1");
      return;
    }
    startPreload();
  }, []);

  const startPreload = async () => {
    setState(s => ({ ...s, active: true, currentLabel: "Подготовка..." }));

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
      sessionStorage.setItem(PRELOADED_KEY, "1");
      setState(s => ({ ...s, active: false }));
      return;
    }

    const estimatedTotal = unique.reduce((acc, a) => {
      if (a.url.match(/\.(mp4|webm|mov)/i)) return acc + 2_000_000;
      if (a.url.match(/\.(mp3|ogg|wav)/i)) return acc + 500_000;
      return acc + 200_000;
    }, 0);

    setState(s => ({ ...s, totalBytes: estimatedTotal }));

    let done = 0;
    let bytesAcc = 0;

    for (const asset of unique) {
      if (doneRef.current) break;
      setState(s => ({ ...s, currentLabel: asset.label }));
      const bytes = await cacheAsset(asset.url);
      bytesAcc += bytes || estimatedTotal / unique.length;
      done += 1;
      const pct = Math.round((done / unique.length) * 100);
      setState(s => ({
        ...s,
        pct,
        loaded: done,
        loadedBytes: Math.min(bytesAcc, estimatedTotal),
      }));
    }

    sessionStorage.setItem(PRELOADED_KEY, "1");
    // Keep bar at 100% briefly then hide
    setState(s => ({ ...s, pct: 100 }));
    setTimeout(() => setState(s => ({ ...s, active: false })), 1200);
  };

  return (
    <PreloadContext.Provider value={state}>
      {children}
    </PreloadContext.Provider>
  );
}
