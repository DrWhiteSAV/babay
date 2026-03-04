import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { Home, ShoppingCart, Settings, Users } from "lucide-react";
import { motion } from "motion/react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { character } = usePlayerStore();

  const navItems = [
    { path: "/hub", icon: <Home size={24} />, label: "Главная" },
    { path: "/shop", icon: <ShoppingCart size={24} />, label: "Магазин" },
    { 
      path: "/profile", 
      icon: character?.avatarUrl ? (
        <img src={character.avatarUrl} alt="profile" className="w-6 h-6 rounded-full object-cover border border-neutral-500" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-neutral-700 border border-neutral-500" />
      ), 
      label: "Профиль" 
    },
    { path: "/settings", icon: <Settings size={24} />, label: "Настройки" },
    { path: "/friends", icon: <Users size={24} />, label: "Друзья" },
  ];

  // Don't show on initial setup screens or game
  if (['/', '/create', '/game'].includes(location.pathname)) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-2xl border-t border-white/10 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ fontSize: '16px' }} // Fixed font size
    >
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              role="button"
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`cursor-pointer relative flex flex-col items-center justify-center w-16 h-14 transition-colors ${
                isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={{ clipPath: 'none', padding: 0, borderRadius: '0.5rem' }}
            >
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -4 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {item.icon}
              </motion.div>
              <span className={`text-[10px] mt-1 transition-opacity ${isActive ? "opacity-100 font-bold" : "opacity-70"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-2 w-8 h-1 bg-white rounded-t-full"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
