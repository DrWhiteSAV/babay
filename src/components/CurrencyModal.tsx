import { motion, AnimatePresence } from "motion/react";
import { X, Skull, Zap } from "lucide-react";

export type CurrencyType = 'fear' | 'watermelons' | 'energy' | null;

interface CurrencyModalProps {
  type: CurrencyType;
  onClose: () => void;
  clickY?: number;
}

export default function CurrencyModal({ type, onClose, clickY }: CurrencyModalProps) {
  if (!type) return null;

  const content = {
    fear: {
      title: "Страх",
      icon: <Skull className="text-red-500" size={48} />,
      description: "Основная валюта в игре. Вы получаете страх за успешное прохождение этапов (правильные выборы в текстовых квестах). Чем выше ваш уровень Телекинеза, тем больше страха вы получаете за каждый успех!"
    },
    watermelons: {
      title: "Арбузы",
      icon: <span className="text-5xl">🍉</span>,
      description: "Премиальная валюта. Вы получаете арбузы за победу над Боссами в конце игровых сессий (когда закликиваете босса до смерти). Используются для покупки редких питомцев и особых предметов!"
    },
    energy: {
      title: "Энергия",
      icon: <Zap className="text-yellow-500" size={48} />,
      description: "Необходима для начала новых игр. Восстанавливается автоматически со временем (1 единица каждые 5 минут). Вы также можете попросить энергию у друзей в разделе 'Друзья'."
    }
  };

  const info = content[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-[90%] shadow-2xl"
          style={{ 
            top: clickY ? Math.max(150, Math.min(clickY, window.innerHeight - 150)) : '50%', 
            left: '50%' 
          }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 bg-neutral-800 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center text-center gap-4 mt-2">
            <div className="p-6 bg-neutral-800/50 rounded-full border border-neutral-700/50 shadow-inner">
              {info.icon}
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-2">{info.title}</h2>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {info.description}
            </p>
            <button onClick={onClose} className="mt-6 w-full py-4 bg-neutral-100 hover:bg-white text-neutral-900 rounded-xl font-black uppercase tracking-widest transition-colors">
              ПОНЯТНО
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
