import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Music, Save, Volume2 } from "lucide-react";
import Header from "../components/Header";

export default function AdminAudio() {
  const navigate = useNavigate();

  const [audioLinks, setAudioLinks] = useState({
    menuMusic: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    bgMusics: [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
    ],
    click: "https://www.soundjay.com/buttons/button-16.mp3",
    transition: "https://www.soundjay.com/free-music/whoosh-01.mp3",
    scream: "https://www.soundjay.com/human/man-scream-01.mp3",
    cat: "https://www.soundjay.com/mechanical/camera-shutter-click-01.mp3",
    fear: "https://www.soundjay.com/human/heartbeat-01.mp3"
  });

  const handleSave = () => {
    // Save logic here
    alert("Настройки аудио сохранены!");
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
        title={<><Music size={20} /> Настройки Аудио</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
          Управление ссылками на аудиофайлы, используемые в игре.
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">Музыка</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Главное меню</label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.menuMusic}
                onChange={(e) => setAudioLinks({...audioLinks, menuMusic: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Фоновая музыка в игре (плейлист)</label>
              {audioLinks.bgMusics.map((music, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                    value={music}
                    onChange={(e) => {
                      const newBgMusics = [...audioLinks.bgMusics];
                      newBgMusics[index] = e.target.value;
                      setAudioLinks({...audioLinks, bgMusics: newBgMusics});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">Звуковые эффекты</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                <Volume2 size={14} /> Клик по кнопке
              </label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.click}
                onChange={(e) => setAudioLinks({...audioLinks, click: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                <Volume2 size={14} /> Переход между страницами
              </label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.transition}
                onChange={(e) => setAudioLinks({...audioLinks, transition: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                <Volume2 size={14} /> Крик (scream)
              </label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.scream}
                onChange={(e) => setAudioLinks({...audioLinks, scream: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                <Volume2 size={14} /> Фото/Кот (cat)
              </label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.cat}
                onChange={(e) => setAudioLinks({...audioLinks, cat: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold flex items-center gap-2">
                <Volume2 size={14} /> Страх/Сердцебиение (fear)
              </label>
              <input 
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                value={audioLinks.fear}
                onChange={(e) => setAudioLinks({...audioLinks, fear: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-700"
        >
          <Save size={20} />
          Сохранить настройки аудио
        </button>
      </div>
    </motion.div>
  );
}
