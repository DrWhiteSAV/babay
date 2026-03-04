import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { ArrowLeft, Target, Star, CheckCircle2 } from "lucide-react";

import Header from "../components/Header";

export default function Events() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quests, globalBackgroundUrl, pageBackgrounds } = usePlayerStore();
    
  const dailyQuests = quests.filter(q => q.type === 'daily');
  const globalQuests = quests.filter(q => q.type === 'global');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden"
    >
            
      <Header 
        title={<><Target size={20} className="text-red-500" /> Ивенты и Задания</>}
        backUrl="/leaderboard"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-8 relative z-10">
        
        <section className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-800">
          <h2 className="text-lg font-bold mb-2 text-white">О заданиях</h2>
          <p className="text-sm text-neutral-400">
            Выполняйте ежедневные и глобальные задания, чтобы получать бонусы:
            <br/>• <span className="text-red-400">Страх</span> — для прокачки телекинеза и покупки инвентаря.
            <br/>• <span className="text-yellow-400">Энергия</span> — для выполнения действий в игре.
            <br/>• <span className="text-green-400">Арбузы</span> — для повышения уровня босса и покупки редкого инвентаря.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Target size={20} className="text-red-500" /> Ежедневные задания
          </h2>
          <div className="space-y-3">
            {dailyQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Star size={20} className="text-blue-500" /> Глобальные задания
          </h2>
          <div className="space-y-3">
            {globalQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}

function QuestCard({ quest }: { quest: any; key?: string | number }) {
  const { completeQuest } = usePlayerStore();
  
  const isReady = quest.progress >= quest.target;
  
  return (
    <div className={`bg-neutral-900 border rounded-2xl p-4 ${quest.completed ? 'border-green-900/50 opacity-50' : isReady ? 'border-red-500' : 'border-neutral-800'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-white">{quest.title}</h3>
          <p className="text-sm text-neutral-400">{quest.description}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold px-2 py-1 rounded bg-neutral-800 text-neutral-300">
            +{quest.reward.amount} {quest.reward.type === 'fear' ? 'Страха' : quest.reward.type === 'energy' ? 'Энергии' : 'Арбузов'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 bg-neutral-950 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${quest.completed ? 'bg-green-500' : 'bg-red-600'}`}
            style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
          />
        </div>
        <span className="text-xs font-mono text-neutral-500 w-12 text-right">
          {quest.progress}/{quest.target}
        </span>
      </div>

      {!quest.completed && isReady && (
        <button 
          onClick={() => completeQuest(quest.id)}
          className="mt-4 w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
        >
          Забрать награду
        </button>
      )}
    </div>
  );
}
