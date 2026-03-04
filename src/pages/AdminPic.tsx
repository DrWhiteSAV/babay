import { useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PAGES = [
  { path: "/", name: "Главная (Home)" },
  { path: "/create", name: "Создание персонажа" },
  { path: "/hub", name: "Хаб (GameHub)" },
  { path: "/game", name: "Игра (Game)" },
  { path: "/shop", name: "Магазин (Shop)" },
  { path: "/profile", name: "Профиль (Profile)" },
  { path: "/settings", name: "Настройки (Settings)" },
  { path: "/friends", name: "Друзья (Friends)" },
  { path: "/chat", name: "Чат (Chat)" },
  { path: "/gallery", name: "Галерея (Gallery)" },
  { path: "/leaderboard", name: "Рейтинг (Leaderboard)" },
];

export default function AdminPic() {
  const navigate = useNavigate();
  const { pageBackgrounds, setPageBackground } = usePlayerStore();
  
  // Local state for editing
  const [bgData, setBgData] = useState<Record<string, { url: string; dimming: number }>>(() => {
    const initial: Record<string, { url: string; dimming: number }> = {};
    PAGES.forEach(page => {
      initial[page.path] = pageBackgrounds[page.path] || { url: "", dimming: 80 };
    });
    return initial;
  });

  const handleUrlChange = (path: string, url: string) => {
    setBgData(prev => ({
      ...prev,
      [path]: { ...prev[path], url }
    }));
  };

  const handleDimmingChange = (path: string, dimming: number) => {
    setBgData(prev => ({
      ...prev,
      [path]: { ...prev[path], dimming }
    }));
  };

  const handleSave = () => {
    Object.entries(bgData).forEach(([path, data]) => {
      const { url, dimming } = data as { url: string; dimming: number };
      if (url.trim() !== "") {
        setPageBackground(path, url.trim(), dimming);
      } else {
        // If empty, we could clear it, but let's just set it to empty so it falls back to global
        setPageBackground(path, "", dimming);
      }
    });
    alert("Настройки фонов сохранены!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-neutral-950 text-neutral-200 relative overflow-y-auto h-screen"
    >
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/admin")}
            className="p-2 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-red-500" />
            Управление фонами
          </h1>
        </div>

        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 mb-6 text-sm text-neutral-400">
          Здесь вы можете задать индивидуальные фоновые изображения для каждой страницы. 
          Если поле URL пустое, будет использоваться глобальный сгенерированный фон.
          Затемнение (0-100) определяет, насколько темным будет оверлей поверх картинки (100 = полностью черный).
        </div>

        <div className="space-y-6">
          {PAGES.map((page) => (
            <div key={page.path} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <h2 className="text-lg font-bold mb-4 text-red-400">{page.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">URL картинки</label>
                  <input
                    type="text"
                    value={bgData[page.path].url}
                    onChange={(e) => handleUrlChange(page.path, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Затемнение: {bgData[page.path].dimming}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgData[page.path].dimming}
                    onChange={(e) => handleDimmingChange(page.path, parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          Сохранить настройки
        </button>
      </div>
    </motion.div>
  );
}
