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
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY") || "AIzaSyCUCb8uYbhPOJSqKw4TtZrCkdLyVlDDbiE";
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action } = await req.json().catch(() => ({ action: "generate" }));

    // List models to find correct image generation model name
    if (action === "list_models") {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}&pageSize=100`
      );
      const listData = await listResp.json();
      const imageModels = listData.models?.filter((m: any) => 
        m.name?.includes("image") || m.name?.includes("flash") || m.name?.includes("imagen")
      ).map((m: any) => ({ name: m.name, displayName: m.displayName, supportedMethods: m.supportedGenerationMethods }));
      return new Response(JSON.stringify({ models: imageModels }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramId = 169262990;
    const prompt = "A portrait of a Slavic cybernetic spirit named Тест-Бабай. They wear pajamas with spooky appearance and a long tongue. Horror style. High quality portrait.";

    // Try different model names
    const modelsToTry = [
      "gemini-2.0-flash-preview-image-generation",
      "gemini-2.0-flash-exp-image-generation",
      "gemini-2.0-flash-exp",
    ];

    let imageBase64: string | null = null;
    let successModel = "";
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      console.log(`Trying model: ${modelName}`);
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );
      const geminiData = await geminiResp.json();
      
      if (!geminiResp.ok) {
        console.log(`Model ${modelName} failed:`, geminiData.error?.message);
        lastError = geminiData;
        continue;
      }

      for (const part of geminiData.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          successModel = modelName;
          break;
        }
      }
      if (imageBase64) break;
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ 
        error: "No image generated from any model", 
        lastError,
        tried: modelsToTry,
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Success with model: ${successModel}, image length: ${imageBase64.length}`);

    // Send via Telegram
    const byteCharacters = atob(imageBase64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const photoBlob = new Blob([byteArray], { type: "image/png" });

    const formData = new FormData();
    formData.append("chat_id", telegramId.toString());
    formData.append("photo", photoBlob, "babay-gen-test.png");
    formData.append("caption", `🧪 Тест ИИ-генерации Бабая\nМодель: ${successModel}`);

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST", body: formData,
    });
    const tgData = await tgResp.json();

    let finalUrl = "";
    if (tgData.ok) {
      const photos = tgData.result?.photo;
      if (photos?.length > 0) {
        const fileResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photos[photos.length - 1].file_id}`);
        const fileData = await fileResp.json();
        if (fileData.ok) finalUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
      }
    }

    // Save to gallery
    if (finalUrl) {
      await supabase.from("gallery").insert({
        telegram_id: telegramId,
        image_url: finalUrl,
        label: "Тест-Бабай (тест генерации)",
        prompt,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      model_used: successModel,
      telegram_sent: tgData.ok,
      telegram_error: tgData.description,
      image_url: finalUrl,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("test-generate-avatar error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
