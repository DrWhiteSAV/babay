// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, telegramId, label, prompt, lore, saveToStorage } = await req.json();

    if (!imageUrl || !telegramId) {
      return new Response(JSON.stringify({ error: "imageUrl and telegramId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let finalUrl = imageUrl;
    let storageUrl: string | null = null;

    // 1. Fetch the image blob
    console.log(`[save-to-gallery] fetching image: ${imageUrl.substring(0, 80)}`);
    let photoBlob: Blob;
    if (imageUrl.startsWith("data:image")) {
      const base64Data = imageUrl.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      photoBlob = new Blob([byteArray], { type: "image/png" });
    } else {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) throw new Error(`Failed to fetch image: ${imgResp.status}`);
      photoBlob = await imgResp.blob();
    }

    // 2. Save to Supabase Storage (avatars bucket)
    const fileName = `${telegramId}/${Date.now()}.png`;
    console.log(`[save-to-gallery] uploading to storage: avatars/${fileName}`);
    const { data: storageData, error: storageError } = await supabase.storage
      .from("avatars")
      .upload(fileName, photoBlob, {
        contentType: "image/png",
        upsert: false,
      });

    if (storageError) {
      console.error("[save-to-gallery] storage upload error:", storageError);
    } else {
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      storageUrl = publicUrlData?.publicUrl || null;
      finalUrl = storageUrl || imageUrl;
      console.log(`[save-to-gallery] storage url: ${finalUrl}`);
    }

    // 3. Send to Telegram with lore caption
    const caption = lore
      ? `🧟 *${label || "Аватар Бабая"}*\n\n${lore}`
      : `🖼 ${label || "Аватар Бабая"}`;

    console.log(`[save-to-gallery] sending to telegram user ${telegramId}`);
    const formData = new FormData();
    formData.append("chat_id", telegramId.toString());
    formData.append("photo", photoBlob, "avatar.png");
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const tgData = await tgResp.json();
    console.log(`[save-to-gallery] telegram response ok=${tgData.ok}`);

    if (!tgData.ok) {
      console.error("[save-to-gallery] Telegram sendPhoto error:", JSON.stringify(tgData));
      // Don't throw — we still have the storage URL
    } else {
      // Optionally use Telegram's file URL as a CDN fallback
      const photos = tgData.result?.photo;
      if (photos && photos.length > 0 && !storageUrl) {
        const biggestPhoto = photos[photos.length - 1];
        const fileResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${biggestPhoto.file_id}`);
        const fileData = await fileResp.json();
        if (fileData.ok && fileData.result?.file_path) {
          finalUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        }
      }
    }

    // 4. Update player_stats avatar_url
    console.log(`[save-to-gallery] updating player_stats avatar_url for ${telegramId}`);
    const { error: statsError } = await supabase
      .from("player_stats")
      .update({ avatar_url: storageUrl || finalUrl })
      .eq("telegram_id", telegramId);

    if (statsError) {
      console.error("[save-to-gallery] player_stats update error:", statsError);
    }

    // 5. Save to gallery table
    const { data, error } = await supabase
      .from("gallery")
      .insert({
        telegram_id: telegramId,
        image_url: storageUrl || finalUrl,
        label: label || null,
        prompt: prompt || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[save-to-gallery] gallery insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[save-to-gallery] done! final_url=${storageUrl || finalUrl}`);
    return new Response(JSON.stringify({
      success: true,
      gallery_item: data,
      storage_url: storageUrl || finalUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[save-to-gallery] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
