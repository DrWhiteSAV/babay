import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { ArrowLeft, Skull, Zap } from "lucide-react";
import { ReactNode, MouseEvent } from "react";

interface TopBarProps {
  title: ReactNode;
  backUrl?: string;
  onInfoClick?: (type: 'fear' | 'watermelons' | 'energy', e: MouseEvent) => void;
}

export default function TopBar({ title, backUrl, onInfoClick }: TopBarProps) {
  const navigate = useNavigate();
  const { fear, watermelons, energy } = usePlayerStore();

  return (
    <header className="flex flex-col md:flex-row items-center justify-between p-4 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-20">
      {/* Mobile: Stats on top, centered */}
      <div className="flex justify-center gap-4 w-full md:w-auto order-1 md:order-3 mb-4 md:mb-0">
        <div 
          className="flex items-center gap-1 text-blue-500 font-bold cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => onInfoClick?.('energy', e)}
        >
          <Zap size={16} /> {energy}
        </div>
        <div 
          className="flex items-center gap-1 text-red-500 font-bold cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => onInfoClick?.('fear', e)}
        >
          <Skull size={16} /> {fear}
        </div>
        <div 
          className="flex items-center gap-1 text-green-500 font-bold cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => onInfoClick?.('watermelons', e)}
        >
          🍉 {watermelons}
        </div>
      </div>

      {/* Mobile: Back button and Title below */}
      <div className="flex items-center justify-between w-full md:w-auto order-2 md:order-1">
        {backUrl ? (
          <button
            onClick={() => navigate(backUrl)}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
          {title}
        </h1>
        <div className="w-10 md:hidden" />
      </div>
    </header>
  );
}
