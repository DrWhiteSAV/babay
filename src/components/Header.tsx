import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { ArrowLeft, Skull, Zap } from "lucide-react";
import { ReactNode, MouseEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePreloadState } from "./AssetPreloader";

interface HeaderProps {
  title?: ReactNode;
  backUrl?: string;
  onInfoClick?: (type: 'fear' | 'watermelons' | 'energy', e: MouseEvent) => void;
  rightContent?: ReactNode;
}

export default function Header({ title, backUrl, onInfoClick, rightContent }: HeaderProps) {
  const navigate = useNavigate();
  const { fear, watermelons, energy, lastEnergyUpdate, storeConfig } = usePlayerStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const preload = usePreloadState();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = now - lastEnergyUpdate;
      const regenRateMs = (storeConfig?.energyRegenMinutes || 5) * 60 * 1000;
      const remaining = regenRateMs - (diff % regenRateMs);
      setTimeLeft(Math.floor(remaining / 1000));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [lastEnergyUpdate, storeConfig?.energyRegenMinutes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  function formatMb(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <header
      className="relative p-4 bg-black/20 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-20 shrink-0 shadow-lg overflow-hidden"
      style={{ fontSize: '16px' }}
    >
      {/* ── Background download progress bar ── */}
      <AnimatePresence>
        {preload.active && (
          <motion.div
            key="preload-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 h-0.5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #7f1d1d, #ef4444, #f97316)" }}
              animate={{ width: `${preload.pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download status chip — shown below the bar while loading */}
      <AnimatePresence>
        {preload.active && (
          <motion.div
            key="preload-chip"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-1 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(239,68,68,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Animated dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-neutral-300">{preload.currentLabel}</span>
            <span className="text-neutral-500">
              {formatMb(preload.loadedBytes)}/{formatMb(preload.totalBytes)}
            </span>
            <span className="text-red-400 font-bold">{preload.pct}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      {backUrl && (
        <div className="absolute left-4 top-14">
          <div
            role="button"
            onClick={() => navigate(backUrl)}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            style={{ clipPath: 'none' }}
          >
            <ArrowLeft size={20} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center w-full">
        {/* Row 1: Stats (top — may be overlapped by camera on mobile) */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <div
            className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => onInfoClick?.('energy', e)}
          >
            <div className="flex items-center gap-1 text-yellow-500 font-bold text-[16px]">
              <Zap size={16} /> {energy}
            </div>
            <div className="text-[10px] text-yellow-500/70 font-bold -mt-1">
              {formatTime(timeLeft)}
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-red-500 font-bold cursor-pointer hover:opacity-80 transition-opacity text-[16px]"
            onClick={(e) => onInfoClick?.('fear', e)}
          >
            <Skull size={16} /> {fear}
          </div>
          <div
            className="flex items-center gap-1 text-green-500 font-bold cursor-pointer hover:opacity-80 transition-opacity text-[16px]"
            onClick={(e) => onInfoClick?.('watermelons', e)}
          >
            🍉 {watermelons}
          </div>
        </div>

        {/* Row 2: Title (below stats — safe from camera overlap) */}
        {title && (
          <h1 className="text-[20px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2 mb-2">
            {title}
          </h1>
        )}

        {/* Row 3: Right Content (bottom row) */}
        {rightContent && (
          <div className="flex justify-center w-full gap-4">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
