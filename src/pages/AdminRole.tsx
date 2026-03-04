import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, Save, Key } from "lucide-react";
import Header from "../components/Header";
import { usePlayerStore } from "../store/playerStore";

export default function AdminRole() {
  const navigate = useNavigate();
  const { character } = usePlayerStore();

  const [roles, setRoles] = useState([
    {
      id: "169262990",
      name: character?.name || "Создатель",
      role: "Супер-Бабай",
      access: "Полный доступ + добавление Ад-Бабаев",
      pages: "Все разделы админки и игры"
    }
  ]);

  const handleSave = () => {
    alert("Уровни доступа сохранены!");
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
        title={<><Shield size={20} /> Уровни доступа</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400 space-y-2">
          <p>Управление ролями и правами доступа по Telegram ID.</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
            <li><strong className="text-red-400">Супер-Бабай:</strong> Полный доступ + добавление Ад-Бабаев.</li>
            <li><strong className="text-orange-400">Ад-Бабай:</strong> Полный доступ (кроме добавления Ад-Бабаев).</li>
            <li><strong className="text-neutral-300">Бабай:</strong> Обычный пользователь (только игра).</li>
          </ul>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-900/50 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4">Telegram ID</th>
                  <th className="px-6 py-4">Имя</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Права</th>
                  <th className="px-6 py-4">Доступные разделы</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                      <Key size={14} className="text-red-500" />
                      {user.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{user.name}</td>
                    <td className="px-6 py-4">
                      <select 
                        className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:border-red-500 outline-none transition-colors text-xs"
                        value={user.role}
                        onChange={(e) => {
                          const newRoles = [...roles];
                          const index = newRoles.findIndex(r => r.id === user.id);
                          if (index !== -1) {
                            newRoles[index].role = e.target.value;
                            setRoles(newRoles);
                          }
                        }}
                      >
                        <option value="Супер-Бабай">Супер-Бабай</option>
                        <option value="Ад-Бабай">Ад-Бабай</option>
                        <option value="Бабай">Бабай</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs">{user.access}</td>
                    <td className="px-6 py-4 text-xs text-neutral-500">{user.pages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-700"
        >
          <Save size={20} />
          Сохранить изменения
        </button>
      </div>
    </motion.div>
  );
}
