import { useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useTelegram } from "../context/TelegramContext";

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes = online
const HEARTBEAT_INTERVAL_MS = 60 * 1000;   // update own presence every 60s

/** Write current user's heartbeat to profiles.updated_at */
export function useOnlinePresence() {
  const { profile } = useTelegram();

  useEffect(() => {
    const tid = profile?.telegram_id;
    if (!tid) return;

    const beat = async () => {
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("telegram_id", tid);
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [profile?.telegram_id]);
}

/** Check if a list of friends are online based on their profiles.updated_at */
export function useFriendOnlineStatus(friendTelegramIds: number[]) {
  const [onlineMap, setOnlineMap] = useState<Record<number, boolean>>({});
  const idsKey = friendTelegramIds.join(",");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (friendTelegramIds.length === 0) return;

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("telegram_id, updated_at")
        .in("telegram_id", friendTelegramIds);

      if (!data) return;
      const now = Date.now();
      const map: Record<number, boolean> = {};
      for (const row of data) {
        const lastSeen = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        map[row.telegram_id] = now - lastSeen < ONLINE_THRESHOLD_MS;
      }
      setOnlineMap(map);
    };

    check();
    intervalRef.current = setInterval(check, 30_000); // poll every 30s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return onlineMap;
}
