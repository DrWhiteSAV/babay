import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Users, Search, X, Bot, Plus, Edit2, Trash2, Loader2,
} from "lucide-react";
import Header from "../components/Header";
import { supabase } from "../integrations/supabase/client";
import { useTelegram } from "../context/TelegramContext";
import { useFriendOnlineStatus } from "../hooks/useOnlinePresence";

/** Per-chat unread counts */
function usePerChatUnread(myTid: number | undefined, chatKeys: string[]): Record<string, number> {
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!myTid || chatKeys.length === 0) { setUnreadMap({}); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("chat_messages").select("chat_key")
        .in("chat_key", chatKeys).neq("sender_telegram_id", myTid).is("read_at", null);
      const map: Record<string, number> = {};
      for (const row of data || []) {
        if (row.chat_key) map[row.chat_key] = (map[row.chat_key] || 0) + 1;
      }
      setUnreadMap(map);
    };
    fetch();
    const channel = supabase.channel(`chats_unread_${myTid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, fetch)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTid, chatKeys.join(",")]);
  return unreadMap;
}

type FilterMode = "all" | "friends" | "groups";

export default function Chats() {
  const navigate = useNavigate();
  const { character, friends, groupChats, updateGroupName, deleteGroupChat, createGroupChat, toggleFriendAi } = usePlayerStore();
  const { profile } = useTelegram();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [friendsMeta, setFriendsMeta] = useState<Record<string, {
    first_name?: string; last_name?: string; username?: string;
    telegram_id?: number; telekinesis_level?: number; avatar_url?: string;
  }>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { text: string; created_at: string }>>({});
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const { dbLoaded } = usePlayerStore();

  // Load friends metadata
  useEffect(() => {
    if (!profile?.telegram_id || friends.length === 0) return;
    const loadMeta = async () => {
      const { data: dbFriends } = await supabase.from("friends")
        .select("friend_name, friend_telegram_id").eq("telegram_id", profile.telegram_id);
      if (!dbFriends || dbFriends.length === 0) return;
      const tgIds = dbFriends.map(f => f.friend_telegram_id).filter(Boolean) as number[];
      if (tgIds.length === 0) return;
      const [profilesRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("telegram_id, first_name, last_name, username").in("telegram_id", tgIds),
        supabase.from("player_stats").select("telegram_id, telekinesis_level, avatar_url").in("telegram_id", tgIds),
      ]);
      const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.telegram_id, p]));
      const statsMap = Object.fromEntries((statsRes.data || []).map(s => [s.telegram_id, s]));
      const meta: Record<string, any> = {};
      for (const f of dbFriends) {
        if (!f.friend_telegram_id) continue;
        const prof = profileMap[f.friend_telegram_id];
        const stats = statsMap[f.friend_telegram_id];
        meta[f.friend_name] = {
          first_name: prof?.first_name, last_name: prof?.last_name,
          username: prof?.username, telegram_id: f.friend_telegram_id,
          telekinesis_level: stats?.telekinesis_level ?? 1, avatar_url: stats?.avatar_url,
        };
      }
      setFriendsMeta(meta);
    };
    loadMeta();
  }, [profile?.telegram_id, friends]);

  // Collect all chat keys
  const allChatKeys = useMemo(() => {
    const myTid = profile?.telegram_id;
    if (!myTid) return [];
    const dmKeys = friends
      .filter(f => f.name !== "ДанИИл" && friendsMeta[f.name]?.telegram_id)
      .map(f => [String(myTid), String(friendsMeta[f.name].telegram_id!)].sort().join("_"));
    const groupKeys = groupChats.map(g => `group_${g.id}`);
    return [...dmKeys, ...groupKeys];
  }, [profile?.telegram_id, friends, friendsMeta, groupChats]);

  const perChatUnread = usePerChatUnread(profile?.telegram_id, allChatKeys);

  // Load last messages for each chat
  useEffect(() => {
    if (allChatKeys.length === 0) return;
    const loadLastMessages = async () => {
      const results: Record<string, { text: string; created_at: string }> = {};
      // Batch query per key
      for (const key of allChatKeys) {
        const { data } = await supabase.from("chat_messages")
          .select("content, created_at").eq("chat_key", key)
          .order("created_at", { ascending: false }).limit(1);
        if (data && data[0]) {
          let text = data[0].content;
          if (text.startsWith("[img]:")) text = "📷 Изображение";
          else if (text.length > 60) text = text.slice(0, 60) + "…";
          results[key] = { text, created_at: data[0].created_at };
        }
      }
      setLastMessages(results);
    };
    loadLastMessages();
  }, [allChatKeys.join(",")]);

  const friendTelegramIds = useMemo(
    () => Object.values(friendsMeta).map(m => m.telegram_id).filter(Boolean) as number[],
    [friendsMeta]
  );
  const onlineMap = useFriendOnlineStatus(friendTelegramIds);

  useEffect(() => {
    if (dbLoaded && !character) navigate("/");
  }, [dbLoaded, character, navigate]);

  if (!dbLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-500">
        <Loader2 size={28} className="animate-spin text-red-700" />
        <span className="text-sm">Загрузка чатов...</span>
      </div>
    );
  }
  if (!character) return null;

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Вчера";
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedFriends.length === 0 || !profile?.telegram_id || !character) return;
    const groupId = Date.now().toString();
    const finalMembers = selectedFriends.includes("ДанИИл") ? selectedFriends : [...selectedFriends, "ДанИИл"];
    await supabase.from("group_chats").insert({ id: groupId, name: newGroupName.trim(), created_by: profile.telegram_id });
    await supabase.from("group_chat_members").upsert({ group_id: groupId, telegram_id: profile.telegram_id, character_name: character.name }, { onConflict: "group_id,telegram_id" });
    const realFriends = finalMembers.filter(n => n !== "ДанИИл" && n !== character.name);
    if (realFriends.length > 0) {
      const { data: statsRows } = await supabase.from("player_stats").select("telegram_id, character_name").in("character_name", realFriends);
      for (const row of statsRows || []) {
        if (!row.telegram_id || !row.character_name) continue;
        await supabase.from("group_chat_members").upsert({ group_id: groupId, telegram_id: row.telegram_id, character_name: row.character_name }, { onConflict: "group_id,telegram_id" });
      }
    }
    createGroupChat(newGroupName.trim(), finalMembers);
    usePlayerStore.setState(s => ({
      groupChats: s.groupChats.map(g =>
        g.members.join(",") === finalMembers.join(",") && g.name === newGroupName.trim() ? { ...g, id: groupId } : g
      ),
    }));
    setNewGroupName(""); setSelectedFriends([]); setShowGroupModal(false);
  };

  const saveGroupName = () => {
    if (editingGroupId && editGroupName.trim()) {
      updateGroupName(editingGroupId, editGroupName.trim());
      setEditingGroupId(null); setEditGroupName("");
    }
  };

  // Build unified chat list
  interface ChatItem {
    type: "dm" | "group" | "ai";
    key: string;
    name: string;
    subtitle?: string;
    avatarUrl: string;
    isOnline?: boolean;
    unread: number;
    lastMsg?: { text: string; created_at: string };
    navState: object;
    groupId?: string;
  }

  const danilItem: ChatItem = {
    type: "ai", key: "ai_danil",
    name: "ДанИИл", subtitle: "ИИ-куратор · Всегда онлайн",
    avatarUrl: "https://i.ibb.co/rKGSq544/image.png",
    isOnline: true, unread: 0,
    lastMsg: undefined,
    navState: { friendName: "ДанИИл" },
  };

  const dmItems: ChatItem[] = friends.filter(f => f.name !== "ДанИИл").map(f => {
    const meta = friendsMeta[f.name] || {};
    const dmKey = meta.telegram_id
      ? [String(profile?.telegram_id), String(meta.telegram_id)].sort().join("_")
      : null;
    const isOnline = meta.telegram_id ? !!onlineMap[meta.telegram_id] : false;
    return {
      type: "dm", key: dmKey || `dm_${f.name}`,
      name: f.name,
      subtitle: meta.first_name ? `${meta.first_name}${meta.last_name ? " " + meta.last_name : ""}` : undefined,
      avatarUrl: meta.avatar_url || `https://picsum.photos/seed/${f.name}/100/100`,
      isOnline, unread: dmKey ? (perChatUnread[dmKey] || 0) : 0,
      lastMsg: dmKey ? lastMessages[dmKey] : undefined,
      navState: { friendName: f.name },
    };
  });

  const groupItems: ChatItem[] = groupChats.map(g => ({
    type: "group", key: `group_${g.id}`,
    name: g.name, subtitle: g.members.join(", "),
    avatarUrl: "", isOnline: undefined,
    unread: perChatUnread[`group_${g.id}`] || 0,
    lastMsg: lastMessages[`group_${g.id}`],
    navState: { groupId: g.id },
    groupId: g.id,
  }));

  // Filter + search
  let visibleItems: ChatItem[] = [danilItem, ...dmItems, ...groupItems];
  if (filter === "friends") visibleItems = [danilItem, ...dmItems];
  if (filter === "groups") visibleItems = groupItems;

  const sq = search.toLowerCase();
  if (sq) {
    visibleItems = visibleItems.filter(item =>
      item.name.toLowerCase().includes(sq) ||
      (item.subtitle || "").toLowerCase().includes(sq) ||
      (item.lastMsg?.text || "").toLowerCase().includes(sq)
    );
  }

  // Sort: unread first, then by last message time
  visibleItems.sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    const ta = a.lastMsg?.created_at || "0";
    const tb = b.lastMsg?.created_at || "0";
    return tb.localeCompare(ta);
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden"
    >
      <div className="fog-container">
        <div className="fog-layer" /><div className="fog-layer-2" />
      </div>

      <Header title={<><MessageSquare size={20} /> Чаты</>} backUrl="/friends" />

      {/* Search + filter */}
      <div className="px-4 pt-4 pb-2 space-y-3 relative z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по именам, тексту сообщений..."
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-red-900/50 transition-colors placeholder-neutral-600"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "friends", "groups"] as FilterMode[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? "bg-red-700 text-white" : "bg-neutral-900/70 text-neutral-400 hover:text-white border border-neutral-800"}`}>
              {f === "all" ? "Все" : f === "friends" ? "Личные" : "Группы"}
            </button>
          ))}
          <button onClick={() => setShowGroupModal(true)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-neutral-900/70 border border-neutral-800 hover:border-red-900/50 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors font-bold">
            <Plus size={13} /> Группа
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 relative z-10">
        {visibleItems.length === 0 && (
          <p className="text-center text-neutral-600 text-sm py-10">Ничего не найдено</p>
        )}
        <AnimatePresence>
          {visibleItems.map((item, idx) => (
            <motion.div key={item.key}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {item.type === "group" ? (
                    <div className="w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      <Users size={20} className="text-purple-400" />
                    </div>
                  ) : (
                    <img src={item.avatarUrl} alt={item.name}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-700" />
                  )}
                  {item.type !== "group" && (
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${item.isOnline ? "bg-green-400 shadow-[0_0_5px_#4ade80]" : "bg-neutral-600"}`} />
                  )}
                  {item.type === "ai" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                      <Bot size={6} className="text-white" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <button className="flex-1 min-w-0 text-left" onClick={() => navigate("/chat", { state: item.navState })}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white text-sm truncate flex items-center gap-1">
                      {item.name}
                      {item.type === "ai" && <span className="text-[10px] text-green-400 font-normal">ИИ</span>}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.lastMsg && (
                        <span className="text-[10px] text-neutral-600">{fmtTime(item.lastMsg.created_at)}</span>
                      )}
                      {item.unread > 0 && (
                        <span className="min-w-[18px] h-4 px-1 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(220,38,38,0.7)]">
                          {item.unread > 99 ? "99+" : item.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.subtitle && !item.lastMsg && (
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
                  )}
                  {item.lastMsg && (
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.lastMsg.text}</p>
                  )}
                </button>

                {/* DM AI toggle */}
                {item.type === "dm" && (() => {
                  const friendObj = friends.find(f => f.name === item.name);
                  return (
                    <button
                      onClick={async () => {
                        if (!friendObj) return;
                        const newVal = !friendObj.isAiEnabled;
                        toggleFriendAi(item.name);
                        if (profile?.telegram_id) {
                          await supabase.from("friends").update({ ai_substitute: newVal } as any)
                            .eq("telegram_id", profile.telegram_id).eq("friend_name", item.name);
                        }
                      }}
                      title={friendObj?.isAiEnabled ? "ИИ-заместитель включён" : "ИИ-заместитель выключен"}
                      className={`p-2 rounded-lg transition-all shrink-0 ${friendObj?.isAiEnabled ? "bg-green-900/50 text-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" : "bg-neutral-800 text-neutral-600 hover:text-neutral-400"}`}
                    >
                      <Bot size={15} />
                    </button>
                  );
                })()}

                {/* Group actions */}
                {item.type === "group" && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingGroupId(item.groupId!); setEditGroupName(item.name); }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => { if (confirm("Удалить группу?")) deleteGroupChat(item.groupId!); }}
                      className="p-1.5 bg-neutral-800 hover:bg-red-900/50 rounded-lg text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Group edit inline */}
              {editingGroupId === item.groupId && (
                <div className="px-3 pb-3 flex gap-2">
                  <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveGroupName()}
                    autoFocus
                    className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                  <button onClick={saveGroupName} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-white text-xs font-bold transition-colors">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingGroupId(null)} className="p-1.5 text-neutral-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Создать групповой чат</h3>
              <button onClick={() => setShowGroupModal(false)} className="text-neutral-500 hover:text-white"><X size={22} /></button>
            </div>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              placeholder="Название группы..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-900" />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.filter(f => f.name !== "ДанИИл").map(f => (
                <label key={f.name} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
                  <input type="checkbox" checked={selectedFriends.includes(f.name)}
                    onChange={() => setSelectedFriends(prev => prev.includes(f.name) ? prev.filter(x => x !== f.name) : [...prev, f.name])}
                    className="accent-red-600" />
                  <span className="text-white text-sm">{f.name}</span>
                </label>
              ))}
            </div>
            <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || selectedFriends.length === 0}
              className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl text-white font-bold transition-colors">
              Создать
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
