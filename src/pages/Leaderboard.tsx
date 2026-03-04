import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Medal, Star, Target, CheckCircle2, ChevronRight, UserPlus } from "lucide-react";

import Header from "../components/Header";
import ProfilePopup from "../components/ProfilePopup";

export default function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { character, achievements, globalBackgroundUrl, pageBackgrounds, addFriend, friends } = usePlayerStore();
    
  const [showProfilePopup, setShowProfilePopup] = useState<string | null>(null);

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: "Бабайка_99", score: 15000, avatar: "https://picsum.photos/seed/b1/100/100" },
    { rank: 2, name: "ТёмныйЛорд", score: 12400, avatar: "https://picsum.photos/seed/b2/100/100" },
    { rank: 3, name: "НочнойУжас", score: 10200, avatar: "https://picsum.photos/seed/b3/100/100" },
    { rank: 4, name: character?.name || "Вы", score: 8500, avatar: character?.avatarUrl || "https://picsum.photos/seed/user/100/100", isUser: true },
    { rank: 5, name: "Скример", score: 7100, avatar: "https://picsum.photos/seed/b4/100/100" },
  ];

  const handleAddFriend = (name: string) => {
    addFriend(name);
    alert(`Заявка в друзья отправлена ${name}!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden"
    >
            
      <Header 
        title={<><Trophy size={20} className="text-yellow-500" /> Рейтинг</>}
        backUrl="/hub"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-8 relative z-10">
        
        {/* Leaderboard Section */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Medal size={20} className="text-yellow-500" /> Топ Бабаев
          </h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {leaderboard.map((user) => {
              const isFriend = friends.some(f => f.name === user.name);
              return (
              <div 
                key={user.rank} 
                className={`flex items-center gap-4 p-4 border-b border-neutral-800 last:border-0 ${user.isUser ? 'bg-red-900/20' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  user.rank === 1 ? 'bg-yellow-500 text-black' :
                  user.rank === 2 ? 'bg-neutral-300 text-black' :
                  user.rank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {user.rank}
                </div>
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border border-neutral-700 object-cover cursor-pointer" 
                  onClick={() => setShowProfilePopup(user.isUser ? "user" : user.name)}
                />
                <div className="flex-1">
                  <h3 
                    className={`font-bold cursor-pointer hover:underline ${user.isUser ? 'text-red-400' : 'text-white'}`}
                    onClick={() => setShowProfilePopup(user.isUser ? "user" : user.name)}
                  >
                    {user.name}
                  </h3>
                  <p className="text-sm text-neutral-500">{user.score} очков страха</p>
                </div>
                {!user.isUser && !isFriend && (
                  <button
                    onClick={() => handleAddFriend(user.name)}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-blue-400 transition-colors"
                    title="Добавить в друзья"
                  >
                    <UserPlus size={18} />
                  </button>
                )}
              </div>
            )})}
          </div>
        </section>

        {/* Events Link Section */}
        <section>
          <button 
            onClick={() => navigate('/events')}
            className="w-full bg-neutral-900 border border-neutral-800 hover:border-red-900/50 rounded-2xl p-4 flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Ивенты и Задания</h2>
                <p className="text-sm text-neutral-400">Ежедневные и глобальные квесты</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-neutral-500 group-hover:text-white transition-colors" />
          </button>
        </section>

        {/* Achievements Section */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" /> Достижения
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.length === 0 ? (
              <p className="text-neutral-500 col-span-2 text-center py-4">Пока нет достижений</p>
            ) : (
              achievements.map(ach => (
                <div key={ach} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/30 text-green-500 flex items-center justify-center">
                    <Trophy size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">Ачивка {ach.replace('quest_', '')}</p>
                    <p className="text-xs text-neutral-500 truncate">Выполнено</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {showProfilePopup && (
        <ProfilePopup name={showProfilePopup} onClose={() => setShowProfilePopup(null)} />
      )}
    </motion.div>
  );
}
