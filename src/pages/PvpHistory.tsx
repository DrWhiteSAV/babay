import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../context/TelegramContext";
import { supabase } from "../integrations/supabase/client";
import { motion } from "motion/react";
import { ArrowLeft, Swords, Loader2, Crown, Filter } from "lucide-react";

interface HistoryRoom {
  id: string;
  difficulty: string;
  status: string;
  organizer_telegram_id: number;
  created_at: string;
  members: Array<{
    telegram_id: number;
    character_name: string | null;
    avatar_url: string | null;
    status: string;
    score: number;
  }>;
}

type FilterTab = "all" | "waiting" | "playing" | "finished" | "cancelled";

export default function PvpHistory() {
  const navigate = useNavigate();
  const { profile } = useTelegram();
  const tgId = profile?.telegram_id;
  const [rooms, setRooms] = useState<HistoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!tgId) return;
    (async () => {
      setLoading(true);
      const { data: memberships } = await supabase
        .from("pvp_room_members")
        .select("room_id")
        .eq("telegram_id", tgId);

      if (!memberships || memberships.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = [...new Set(memberships.map(m => m.room_id))];
      const { data: roomsData } = await supabase
        .from("pvp_rooms")
        .select("*")
        .in("id", roomIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!roomsData) { setRooms([]); setLoading(false); return; }

      const { data: allMembers } = await supabase
        .from("pvp_room_members")
        .select("room_id, telegram_id, character_name, avatar_url, status, score")
        .in("room_id", roomIds);

      const result: HistoryRoom[] = roomsData.map(r => ({
        ...r,
        members: (allMembers || []).filter(m => m.room_id === r.id),
      }));

      setRooms(result);
      setLoading(false);
    })();
  }, [tgId]);

  const filtered = filter === "all" ? rooms : rooms.filter(r => r.status === filter);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "waiting", label: "Активные" },
    { key: "finished", label: "Завершённые" },
    { key: "cancelled", label: "Отменённые" },
  ];

  const statusBadge = (s: string) => {
    if (s === "waiting") return { text: "Ожидание", cls: "bg-yellow-900/60 text-yellow-400" };
    if (s === "playing") return { text: "Игра", cls: "bg-green-900/60 text-green-400" };
    if (s === "finished") return { text: "Завершено", cls: "bg-neutral-800 text-neutral-400" };
    if (s === "cancelled") return { text: "Отменено", cls: "bg-red-900/60 text-red-400" };
    return { text: s, cls: "bg-neutral-800 text-neutral-400" };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-transparent text-white relative z-10 overflow-hidden">
      <header className="flex items-center gap-3 p-4 bg-black/30 backdrop-blur-xl border-b border-white/10 shrink-0">
        <button onClick={() => navigate("/hub")} className="p-2 bg-neutral-900/80 rounded-full hover:bg-neutral-800 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Swords size={18} className="text-red-500" /> История PVP
          </h1>
        </div>
      </header>

      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.key ? "bg-red-700 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800"
            }`}
          >
            {tab.label}
            <span className="ml-1 opacity-60">
              ({tab.key === "all" ? rooms.length : rooms.filter(r => r.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            <Swords size={32} className="mx-auto mb-3 opacity-40" />
            <p>Нет PVP игр</p>
          </div>
        ) : filtered.map(room => {
          const badge = statusBadge(room.status);
          const maxScore = Math.max(0, ...room.members.filter(m => m.status === "finished").map(m => m.score));
          return (
            <button
              key={room.id}
              onClick={() => {
                if (room.status === "waiting" || room.status === "playing") navigate(`/pvp/room/${room.id}`);
                else navigate(`/pvp/results/${room.id}`);
              }}
              className="w-full bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 text-left hover:border-neutral-600 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">#{room.id} · {room.difficulty}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.cls}`}>{badge.text}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {room.members.slice(0, 4).map(m => (
                  <div key={m.telegram_id} className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800">
                      {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs flex items-center justify-center w-full h-full">👻</span>}
                    </div>
                    <span className="text-xs text-neutral-400 truncate max-w-[80px]">{m.character_name || "?"}</span>
                    {m.telegram_id === room.organizer_telegram_id && <Crown size={10} className="text-yellow-400" />}
                  </div>
                ))}
              </div>
              {room.status === "finished" && maxScore > 0 && (
                <div className="text-xs text-neutral-500 mt-2">Лучший результат: 💀 {maxScore}</div>
              )}
              <div className="text-[10px] text-neutral-600 mt-1">{new Date(room.created_at).toLocaleDateString("ru-RU")}</div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
