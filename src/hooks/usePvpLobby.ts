import { useState, useEffect, useRef } from "react";
import { supabase } from "../integrations/supabase/client";

export interface PvpLobbyRoom {
  id: string;
  difficulty: string;
  status: string;
  organizer_telegram_id: number;
  started_at: string | null;
  timer_ends_at: string | null;
}

export interface PvpLobbyMember {
  telegram_id: number;
  character_name: string | null;
  avatar_url: string | null;
  status: string;
  score: number;
  finished_at: string | null;
}

export interface PvpLobbyData {
  room: PvpLobbyRoom;
  members: PvpLobbyMember[];
  myStatus: string;
}

/** Returns active PVP rooms (waiting/playing) for the current user. */
export function usePvpLobbies(tgId: number | undefined): PvpLobbyData[] {
  const [lobbies, setLobbies] = useState<PvpLobbyData[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLobbies = async () => {
    if (!tgId) return;

    const { data: memberships } = await supabase
      .from("pvp_room_members")
      .select("room_id, status")
      .eq("telegram_id", tgId)
      .in("status", ["invited", "joined", "playing"]);

    if (!memberships || memberships.length === 0) {
      setLobbies([]);
      return;
    }

    const roomIds = memberships.map(m => m.room_id);
    const { data: rooms } = await supabase
      .from("pvp_rooms")
      .select("*")
      .in("id", roomIds)
      .in("status", ["waiting", "playing"])
      .order("created_at", { ascending: false });

    if (!rooms || rooms.length === 0) {
      setLobbies([]);
      return;
    }

    const allRoomIds = rooms.map(r => r.id);
    const { data: allMembers } = await supabase
      .from("pvp_room_members")
      .select("room_id, telegram_id, character_name, avatar_url, status, score, finished_at")
      .in("room_id", allRoomIds);

    const result: PvpLobbyData[] = rooms.map(room => {
      const roomMembers = (allMembers || []).filter(m => m.room_id === room.id);
      const myMember = roomMembers.find(m => m.telegram_id === tgId);
      return {
        room: room as PvpLobbyRoom,
        members: roomMembers as PvpLobbyMember[],
        myStatus: myMember?.status || "invited",
      };
    });

    setLobbies(result);
  };

  useEffect(() => {
    if (!tgId) return;
    fetchLobbies();

    const channel = supabase
      .channel(`pvp_lobbies_${tgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pvp_rooms" }, fetchLobbies)
      .on("postgres_changes", { event: "*", schema: "public", table: "pvp_room_members" }, fetchLobbies)
      .subscribe();

    pollRef.current = setInterval(fetchLobbies, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tgId]);

  return lobbies;
}

/** Legacy single-lobby hook — returns first active lobby or null */
export function usePvpLobby(tgId: number | undefined): PvpLobbyData | null {
  const lobbies = usePvpLobbies(tgId);
  return lobbies.length > 0 ? lobbies[0] : null;
}
