import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BarChart3, Users, Zap, TrendingUp, Activity } from "lucide-react";
import Header from "../components/Header";

export default function AdminStat() {
  const navigate = useNavigate();

  const stats = [
    { label: "Всего Бабаев (игроков)", value: "1,204", icon: <Users className="text-blue-400" size={24} /> },
    { label: "Собрано Страха", value: "8.5M", icon: <Zap className="text-red-400" size={24} /> },
    { label: "Потрачено Арбузов", value: "45K", icon: <TrendingUp className="text-green-400" size={24} /> },
    { label: "Активных сессий", value: "142", icon: <Activity className="text-purple-400" size={24} /> },
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
        title={<><BarChart3 size={20} /> Статистика</>}
        backUrl="/admin"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
          Общая статистика приложения. Данные обновляются в реальном времени.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-1 font-mono">{stat.value}</h3>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <BarChart3 size={18} className="text-red-500" />
            График активности (демо)
          </h3>
          <div className="h-48 w-full flex items-end gap-2 justify-between pt-4">
            {/* Mock chart bars */}
            {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
              <div key={i} className="w-full bg-neutral-800 rounded-t-sm relative group">
                <div 
                  className="absolute bottom-0 w-full bg-red-900/50 border-t border-red-500 rounded-t-sm transition-all duration-500 group-hover:bg-red-500" 
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-500 font-mono">
            <span>Пн</span>
            <span>Вт</span>
            <span>Ср</span>
            <span>Чт</span>
            <span>Пт</span>
            <span>Сб</span>
            <span>Вс</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
