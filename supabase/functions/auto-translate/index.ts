import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

async function verifyAuth(req: Request): Promise<boolean> {
  const sentSecret = req.headers.get("x-admin-secret") ?? "";
  if (ADMIN_SECRET && sentSecret === ADMIN_SECRET) return true;
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (res.ok) return true;
  }
  return false;
}

async function groqTranslate(text: string, targetLang: "ja" | "en"): Promise<string> {
  if (!text.trim()) return "";
  const langName = targetLang === "ja" ? "Japanese" : "English";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional food translator. Translate food item text from Portuguese to ${langName}. Return ONLY the translated text, nothing else. No explanations, no quotes.`,
        },
        { role: "user", content: text },
      ],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (!(await verifyAuth(req))) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: { nome_pt?: string; desc_pt?: string; ingredientes_pt?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { nome_pt, desc_pt, ingredientes_pt } = body;
  if (!nome_pt) return jsonResponse({ error: "nome_pt é obrigatório" }, 400);

  // Traduz cada campo separadamente em paralelo para JA e EN
  const [
    nome_ja, nome_en,
    desc_ja, desc_en,
    ing_ja_raw, ing_en_raw,
  ] = await Promise.all([
    groqTranslate(nome_pt, "ja"),
    groqTranslate(nome_pt, "en"),
    groqTranslate(desc_pt || "", "ja"),
    groqTranslate(desc_pt || "", "en"),
    groqTranslate(ingredientes_pt || "", "ja"),
    groqTranslate(ingredientes_pt || "", "en"),
  ]);

  // Ingredientes vêm como texto separado por vírgula — manter como array
  const toArray = (s: string) => s ? s.split(",").map(x => x.trim()).filter(Boolean) : [];

  return jsonResponse({
    ok: true,
    nome_ja,
    nome_en,
    desc_ja,
    desc_en,
    ingredientes_ja: toArray(ing_ja_raw),
    ingredientes_en: toArray(ing_en_raw),
  });
});
