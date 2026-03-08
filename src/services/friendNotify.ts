import { supabase } from "../integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Sends a Telegram notification to `targetTelegramId` informing them
 * that `adderTelegramId` added them as a friend.
 */
export async function notifyFriendAdded(
  adderTelegramId: number,
  targetTelegramId: number
) {
  try {
    // Load adder's profile + stats
    const [profRes, statsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("telegram_id", adderTelegramId)
        .single(),
      supabase
        .from("player_stats")
        .select("character_name, avatar_url, lore, telekinesis_level, fear")
        .eq("telegram_id", adderTelegramId)
        .single(),
    ]);

    const prof = profRes.data;
    const stats = statsRes.data;

    const fullName = [prof?.first_name, prof?.last_name].filter(Boolean).join(" ") || "Бабай";
    const usernameStr = prof?.username ? ` @${prof.username}` : "";
    const tgLink = prof?.username ? `[${fullName}${usernameStr}](https://t.me/${prof.username})` : fullName;

    const babayName = stats?.character_name || fullName;
    const lore = stats?.lore || "История этого Бабая покрыта мраком...";
    const avatarUrl = stats?.avatar_url || null;
    const tk = stats?.telekinesis_level ?? 1;
    const fear = stats?.fear ?? 0;

    const caption =
      `👻 *Тебя добавили в друзья!*\n\n` +
      `*${tgLink}* добавил тебя как контакт в Бабай\\-игре\\.\n\n` +
      `🧿 *Бабай:* ${babayName}\n` +
      `⚡ Телекинез: ${tk} ур\\. · 😱 Страх: ${fear}\n\n` +
      `📖 *Лор:* _${lore}_`;

    await fetch(`${SUPABASE_URL}/functions/v1/send-telegram-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        telegram_id: targetTelegramId,
        photo_url: avatarUrl,
        caption,
      }),
    });
  } catch (e) {
    console.error("notifyFriendAdded error:", e);
  }
}
