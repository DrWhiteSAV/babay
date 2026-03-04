import { useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { Save, ArrowLeft, Video, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminVideo() {
  const navigate = useNavigate();
  const { videoCutscenes, setVideoCutscenes } = usePlayerStore();
  
  // Local state for editing
  const [verticalVideos, setVerticalVideos] = useState<string[]>([...videoCutscenes.vertical]);
  const [horizontalVideos, setHorizontalVideos] = useState<string[]>([...videoCutscenes.horizontal]);

  const handleVerticalChange = (index: number, value: string) => {
    const newVideos = [...verticalVideos];
    newVideos[index] = value;
    setVerticalVideos(newVideos);
  };

  const handleHorizontalChange = (index: number, value: string) => {
    const newVideos = [...horizontalVideos];
    newVideos[index] = value;
    setHorizontalVideos(newVideos);
  };

  const addVertical = () => setVerticalVideos([...verticalVideos, ""]);
  const addHorizontal = () => setHorizontalVideos([...horizontalVideos, ""]);

  const removeVertical = (index: number) => {
    setVerticalVideos(verticalVideos.filter((_, i) => i !== index));
  };

  const removeHorizontal = (index: number) => {
    setHorizontalVideos(horizontalVideos.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Filter out empty strings
    const finalVertical = verticalVideos.filter(v => v.trim() !== "");
    const finalHorizontal = horizontalVideos.filter(v => v.trim() !== "");
    
    setVideoCutscenes(finalVertical, finalHorizontal);
    alert("Настройки видео сохранены!");
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
            <Video className="w-6 h-6 text-red-500" />
            Управление видео
          </h1>
        </div>

        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 mb-6 text-sm text-neutral-400">
          Здесь вы можете управлять ссылками на видео для стартовой катсцены. 
          Вертикальные видео используются на мобильных устройствах, горизонтальные — на ПК.
          При запуске выбирается случайное видео из соответствующего списка.
        </div>

        <div className="space-y-8">
          {/* Vertical Videos */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-400">Вертикальные видео (Мобильные)</h2>
              <button 
                onClick={addVertical}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors"
                title="Добавить видео"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {verticalVideos.length === 0 && (
                <p className="text-neutral-500 text-sm italic">Список пуст</p>
              )}
              {verticalVideos.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleVerticalChange(index, e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    onClick={() => removeVertical(index)}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Videos */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-400">Горизонтальные видео (ПК)</h2>
              <button 
                onClick={addHorizontal}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors"
                title="Добавить видео"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {horizontalVideos.length === 0 && (
                <p className="text-neutral-500 text-sm italic">Список пуст</p>
              )}
              {horizontalVideos.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleHorizontalChange(index, e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    onClick={() => removeHorizontal(index)}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
