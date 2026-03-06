import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";
import { useTelegram } from "../context/TelegramContext";
import { supabase } from "../integrations/supabase/client";

const DEFAULT_FONT_SIZE = 12;
const DEFAULT_BUTTON_SIZE = "small";

export function usePlayerStatsSync() {
  const store = usePlayerStore();
  const { profile } = useTelegram();

  // Load from Supabase on first mount
  useEffect(() => {
    if (!profile?.telegram_id) return;

    const loadStats = async () => {
      const { data } = await supabase
        .from("player_stats")
        .select("*")
        .eq("telegram_id", profile.telegram_id)
        .single();

      if (!data) return;

      const state = usePlayerStore.getState();

      // Restore numeric stats only if DB has higher values
      if (data.fear > state.fear) store.addFear(data.fear - state.fear);
      if (data.energy > state.energy) store.addEnergy(data.energy - state.energy);
      if (data.watermelons > state.watermelons) store.addWatermelons(data.watermelons - state.watermelons);

      // Restore character if not set
      if (!state.character && data.character_name) {
        store.setCharacter({
          name: data.character_name,
          gender: (data.character_gender as any) || "Бабай",
          style: (data.character_style as any) || "Хоррор",
          wishes: (data.custom_settings as any)?.wishes || [],
          avatarUrl: data.avatar_url || "https://i.ibb.co/BVgY7XrT/babai.png",
          telekinesisLevel: data.telekinesis_level || 1,
          lore: data.lore || undefined,
        });
      } else if (state.character && data.lore && !state.character.lore) {
        store.updateCharacter({ lore: data.lore });
      }

      // Restore avatar URL from DB if it's an imgbb link (more reliable)
      if (state.character && data.avatar_url && data.avatar_url.includes("i.ibb.co")) {
        if (state.character.avatarUrl !== data.avatar_url) {
          store.updateCharacter({ avatarUrl: data.avatar_url });
        }
      }

      // Restore settings from DB - only override if DB has explicitly saved values
      if (data.custom_settings && typeof data.custom_settings === "object") {
        const cs = data.custom_settings as any;
        // Only apply settings if they exist in DB custom_settings
        const settingsUpdate: Record<string, any> = {};
        if (cs.buttonSize !== undefined) settingsUpdate.buttonSize = cs.buttonSize;
        if (cs.fontFamily !== undefined) settingsUpdate.fontFamily = cs.fontFamily;
        if (cs.fontSize !== undefined) settingsUpdate.fontSize = cs.fontSize;
        if (cs.fontBrightness !== undefined) settingsUpdate.fontBrightness = cs.fontBrightness;
        if (cs.theme !== undefined) settingsUpdate.theme = cs.theme;
        if (cs.musicVolume !== undefined) settingsUpdate.musicVolume = cs.musicVolume;
        if (cs.ttsEnabled !== undefined) settingsUpdate.ttsEnabled = cs.ttsEnabled;
        
        if (Object.keys(settingsUpdate).length > 0) {
          store.updateSettings(settingsUpdate);
        }
      }
    };

    loadStats();
  }, [profile?.telegram_id]);

  // Sync to Supabase on state changes (debounced)
  useEffect(() => {
    if (!profile?.telegram_id || !store.character) return;

    const syncData = {
      telegram_id: profile.telegram_id,
      fear: store.fear,
      energy: store.energy,
      watermelons: store.watermelons,
      boss_level: store.bossLevel,
      telekinesis_level: store.character.telekinesisLevel,
      character_name: store.character.name,
      character_gender: store.character.gender,
      character_style: store.character.style,
      avatar_url: store.character.avatarUrl,
      lore: store.character.lore || null,
      custom_settings: {
        buttonSize: store.settings.buttonSize,
        fontFamily: store.settings.fontFamily,
        fontSize: store.settings.fontSize,
        fontBrightness: store.settings.fontBrightness,
        theme: store.settings.theme,
        musicVolume: store.settings.musicVolume,
        ttsEnabled: store.settings.ttsEnabled,
        wishes: store.character.wishes,
        inventory: store.inventory,
      },
    };

    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from("player_stats")
        .upsert(syncData, { onConflict: "telegram_id" });
      if (error) console.error("player_stats sync error:", error.message);

      if (store.character) {
        await supabase.from("leaderboard_cache").upsert({
          telegram_id: profile.telegram_id,
          display_name: store.character.name,
          fear: store.fear,
          telekinesis_level: store.character.telekinesisLevel,
          avatar_url: store.character.avatarUrl,
        }, { onConflict: "telegram_id" });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    profile?.telegram_id,
    store.fear,
    store.energy,
    store.watermelons,
    store.bossLevel,
    store.character?.telekinesisLevel,
    store.character?.name,
    store.character?.gender,
    store.character?.style,
    store.character?.avatarUrl,
    store.character?.lore,
    store.settings,
    store.inventory,
  ]);
}
