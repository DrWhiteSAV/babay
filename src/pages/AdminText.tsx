import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Type, Save } from "lucide-react";
import Header from "../components/Header";

export default function AdminText() {
  const navigate = useNavigate();

  const [texts, setTexts] = useState([
    {
      id: "home_title",
      page: "Главная",
      key: "Заголовок",
      value: "Добро пожаловать в игру",
    },
    {
      id: "home_subtitle",
      page: "Главная",
      key: "Подзаголовок",
      value: "Нажми, чтобы начать",
    },
    {
      id: "shop_title",
      page: "Магазин",
      key: "Заголовок",
      value: "Магазин",
    },
    {
      id: "shop_empty",
      page: "Магазин",
      key: "Пустой список",
      value: "Здесь пока ничего нет",
    }
  ]);

  const handleSave = () => {
    // Save logic here
    alert("Тексты сохранены!");
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
        title={<><Type size={20} /> Управление текстами</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
          Управление текстами на страницах приложения.
        </div>

        <div className="space-y-4">
          {texts.map((text, index) => (
            <div key={text.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{text.page}</span>
                <span className="text-xs text-neutral-500">{text.key}</span>
              </div>
              <textarea 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors min-h-[80px] resize-y"
                value={text.value}
                onChange={(e) => {
                  const newTexts = [...texts];
                  newTexts[index].value = e.target.value;
                  setTexts(newTexts);
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-700"
        >
          <Save size={20} />
          Сохранить тексты
        </button>
      </div>
    </motion.div>
  );
}
