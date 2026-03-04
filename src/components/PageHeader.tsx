import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Ghost, Droplet } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  extraContent?: React.ReactNode;
}

export function PageHeader({ title, backTo = "/hub", extraContent }: PageHeaderProps) {
  const navigate = useNavigate();
  const { energy, fear, watermelons } = usePlayerStore();

  return (
    <header className="relative p-4 bg-neutral-900 border-b border-neutral-800 z-20 shrink-0" style={{ fontSize: '16px' }}>
      <div className="absolute left-4 top-4 mt-6">
        <button
          onClick={() => navigate(backTo)}
          className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center w-full">
        {/* Row 1: Stats */}
        <div className="flex items-center gap-4 mb-2 text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Zap size={16} />
            <span>{Math.floor(energy)}</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <Ghost size={16} />
            <span>{Math.floor(fear)}</span>
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <Droplet size={16} />
            <span>{Math.floor(watermelons)}</span>
          </div>
        </div>
        
        {/* Extra Content (e.g. Profile icons) */}
        {extraContent && (
          <div className="mb-2 flex justify-center w-full">
            {extraContent}
          </div>
        )}

        {/* Row 2: Title */}
        <h1 className="text-xl font-bold text-center">{title}</h1>
      </div>
    </header>
  );
}
