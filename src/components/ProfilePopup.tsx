import { motion } from "motion/react";
import { X } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

interface ProfilePopupProps {
  name: string;
  onClose: () => void;
}

export default function ProfilePopup({ name, onClose }: ProfilePopupProps) {
  const { character, fear, energy, watermelons, bossLevel, inventory, shopItems, bossItems } = usePlayerStore();

  const isUser = name === character?.name || name === "user";
  const displayName = isUser ? character?.name : name;

  // Deterministic mock data generator based on name
  const getMockData = (seedName: string) => {
    let hash = 0;
    for (let i = 0; i < seedName.length; i++) {
      hash = seedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    
    const isDanil = seedName === "ДанИИл";

    return {
      avatarUrl: isDanil ? "https://picsum.photos/seed/danil/200/200" : `https://picsum.photos/seed/${seedName}/200/200`,
      gender: isDanil ? "Бабай" : (absHash % 2 === 0 ? "Бабай" : "Бабайка"),
      style: isDanil ? "Киберпанк" : ["Фотореализм", "Хоррор", "Стимпанк", "Киберпанк", "Аниме", "Постсоветский"][absHash % 6],
      fear: isDanil ? 999999 : (absHash % 10000) + 1000,
      energy: isDanil ? 9999 : (absHash % 500) + 50,
      watermelons: isDanil ? 999 : (absHash % 100) + 10,
      telekinesisLevel: isDanil ? 99 : (absHash % 10) + 1,
      bossLevel: isDanil ? 99 : (absHash % 5) + 1,
      inventory: isDanil ? ["boss_1", "boss_2"] : (absHash % 2 === 0 ? ["shop_1", "shop_2"] : ["shop_3", "shop_4"]),
      lore: isDanil 
        ? "ДанИИл — Главный ИИ-начальник. Строг, но справедлив. Требует регулярных отчетов о выселении. Создан из чистого кода и первобытного страха. Контролирует все процессы в мире Бабаев."
        : `Один из бабаев, работающих в соседнем районе. Известен своими нестандартными методами запугивания.`
    };
  };

  const data = isUser ? {
    avatarUrl: character?.avatarUrl || "https://picsum.photos/seed/user/200/200",
    gender: character?.gender,
    style: character?.style,
    fear,
    energy,
    watermelons,
    telekinesisLevel: character?.telekinesisLevel || 1,
    bossLevel,
    inventory,
    lore: character?.lore || "История умалчивает..."
  } : getMockData(name);

  const allItems = [...shopItems, ...bossItems];
  const userItems = data.inventory?.map(id => allItems.find(i => i.id === id || i.name === id)).filter(Boolean) || [];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 sticky top-0 bg-neutral-900 z-10 pb-2 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Профиль</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <img src={data.avatarUrl} alt="avatar" className={`w-full aspect-square object-cover rounded-xl border-2 ${isUser ? 'border-red-900/50' : 'border-neutral-700'}`} />
          <div>
            <h3 className={`text-2xl font-black uppercase ${isUser ? 'text-red-500' : 'text-white'}`}>{displayName}</h3>
            <p className="text-neutral-400">{data.gender} • {data.style}</p>
          </div>
          
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <h4 className="text-xs font-bold text-neutral-500 uppercase mb-1">История духа</h4>
            <p className="text-sm text-neutral-300">{data.lore}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-500 block">Энергия</span>
              <span className="text-yellow-500 font-bold">{data.energy}</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-500 block">Страх</span>
              <span className="text-red-500 font-bold">{data.fear}</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-500 block">Арбузы</span>
              <span className="text-green-500 font-bold">{data.watermelons}</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-500 block">Телекинез</span>
              <span className="text-blue-400 font-bold">{data.telekinesisLevel} ур.</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 col-span-2">
              <span className="text-xs text-neutral-500 block">Уровень босса</span>
              <span className="text-purple-400 font-bold">{data.bossLevel} ур.</span>
            </div>
          </div>

          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">Инвентарь</h4>
            {userItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {userItems.map((item: any, i: number) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 flex flex-col items-center text-center gap-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl bg-neutral-800">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold text-white line-clamp-1">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Пусто</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
