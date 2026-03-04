import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Image as ImageIcon, X, Download } from "lucide-react";
import { useAudio } from "../hooks/useAudio";

import Header from "../components/Header";

export default function Gallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gallery, settings, globalBackgroundUrl, pageBackgrounds } = usePlayerStore();
      const { playClick } = useAudio(settings.musicVolume);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden h-screen"
    >
            <div className="fog-container">
        <div className="fog-layer"></div>
        <div className="fog-layer-2"></div>
      </div>

      <Header 
        title={<><ImageIcon size={20} /> Галерея</>}
        backUrl="/profile"
      />

      <div className="bg-red-900/20 border-b border-red-900/30 p-2 text-[10px] text-center text-red-300 uppercase tracking-tighter">
        Память духа ограничена. Хранятся только последние 6 образов.
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <ImageIcon size={48} className="mb-4 opacity-50" />
            <p>Галерея пуста...</p>
            <p className="text-xs mt-2">Играйте, чтобы открыть новые образы.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-xl overflow-hidden border border-neutral-800 cursor-pointer hover:border-red-900/50 transition-colors relative group"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img}
                  alt={`Gallery item ${index}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700 transition-colors z-50"
              onClick={(e) => {
                e.stopPropagation();
                playClick();
                setSelectedImage(null);
              }}
            >
              <X size={24} />
            </button>
            
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-neutral-800"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div className="mt-4 flex justify-center">
                <a
                  href={selectedImage}
                  download={`babai_gallery_${Date.now()}.png`}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-full transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                  }}
                >
                  <Download size={16} /> Скачать
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
