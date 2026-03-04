import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bot, Save, Settings2, Key, MessageSquare } from "lucide-react";
import Header from "../components/Header";

export default function AdminAI() {
  const navigate = useNavigate();

  const [aiSettings, setAiSettings] = useState([
    {
      id: "chat",
      name: "Чат с ИИ (ДанИИл)",
      service: "gemini-3.1-pro-preview",
      apiKey: "*********************",
      prompt: "Ты ДанИИл, друг пользователя. Отвечай коротко, с юмором, иногда используй сленг.",
    },
    {
      id: "avatar",
      name: "Генерация Аватаров",
      service: "gemini-3.1-flash-image-preview",
      apiKey: "*********************",
      prompt: "Создай аватар в стиле киберпанк/аниме/реализм для персонажа с именем {name}.",
    },
    {
      id: "names",
      name: "Генерация Имен",
      service: "gemini-3-flash-preview",
      apiKey: "*********************",
      prompt: "Сгенерируй 5 уникальных имен для персонажа в хоррор-игре.",
    }
  ]);

  const handleSave = () => {
    // Save logic here
    alert("Настройки ИИ сохранены!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden"
    >
      <div className="fog-container">
        <div className="fog-layer"></div>
        <div className="fog-layer-2"></div>
      </div>

      <Header 
        title={<><Bot size={20} /> Настройки ИИ</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
          Управление настройками AI сервисов, ключами, промптами и выбором нейросетей для каждого раздела.
        </div>

        <div className="space-y-6">
          {aiSettings.map((setting, index) => (
            <div key={setting.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                <Settings2 className="text-red-500" size={24} />
                <h3 className="text-lg font-bold text-white">{setting.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Bot size={14} /> Модель ИИ
                  </label>
                  <select 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                    value={setting.service}
                    onChange={(e) => {
                      const newSettings = [...aiSettings];
                      newSettings[index].service = e.target.value;
                      setAiSettings(newSettings);
                    }}
                  >
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                    <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Image</option>
                    <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 TTS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Key size={14} /> API Ключ
                  </label>
                  <input 
                    type="password"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                    value={setting.apiKey}
                    onChange={(e) => {
                      const newSettings = [...aiSettings];
                      newSettings[index].apiKey = e.target.value;
                      setAiSettings(newSettings);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                  <MessageSquare size={14} /> Системный Промпт
                </label>
                <textarea 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors min-h-[100px] resize-y"
                  value={setting.prompt}
                  onChange={(e) => {
                    const newSettings = [...aiSettings];
                    newSettings[index].prompt = e.target.value;
                    setAiSettings(newSettings);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-700"
        >
          <Save size={20} />
          Сохранить настройки ИИ
        </button>
      </div>
    </motion.div>
  );
}
