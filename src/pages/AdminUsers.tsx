import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Users, ShieldAlert } from "lucide-react";
import Header from "../components/Header";
import { usePlayerStore } from "../store/playerStore";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { character, fear, watermelons, energy } = usePlayerStore();

  const mockUsers = [
    {
      id: "169262990",
      name: character?.name || "Неизвестный",
      gender: character?.gender || "-",
      style: character?.style || "-",
      fear: fear,
      watermelons: watermelons,
      energy: energy,
      role: "admin"
    }
  ];

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
        title={<><Users size={20} /> Пользователи</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
          Управление профилями пользователей, их балансами и информацией.
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-900/50 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4">Telegram ID</th>
                  <th className="px-6 py-4">Имя</th>
                  <th className="px-6 py-4">Пол / Стиль</th>
                  <th className="px-6 py-4">Страх</th>
                  <th className="px-6 py-4">Арбузы</th>
                  <th className="px-6 py-4">Энергия</th>
                  <th className="px-6 py-4">Роль</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-white">{user.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{user.name}</td>
                    <td className="px-6 py-4">{user.gender} / {user.style}</td>
                    <td className="px-6 py-4 text-red-400">{user.fear}</td>
                    <td className="px-6 py-4 text-green-400">{user.watermelons}</td>
                    <td className="px-6 py-4 text-blue-400">{user.energy}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-400 text-xs border border-red-900/50">
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
