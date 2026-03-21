import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPL_API_KEY = Deno.env.get("DEEPL_API_KEY") ?? "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

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

async function deepLTranslate(texts: string[], targetLang: string): Promise<string[]> {
  const nonEmpty = texts.filter(t => t.trim());
  if (nonEmpty.length === 0) return texts.map(() => "");

  const res = await fetch(DEEPL_URL, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "PT",
      target_lang: targetLang,
    }),
  });

  if (!res.ok) {
    console.error("DeepL error:", res.status, await res.text());
    return texts.map(() => "");
  }

  const data = await res.json();
  return (data.translations as { text: string }[]).map(t => t.text);
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

  const texts = [nome_pt, desc_pt || "", ingredientes_pt || ""];

  // Traduz para JA e EN em paralelo
  const [jaResults, enResults] = await Promise.all([
    deepLTranslate(texts, "JA"),
    deepLTranslate(texts, "EN-US"),
  ]);

  const toArray = (s: string) =>
    s ? s.split(",").map(x => x.trim()).filter(Boolean) : [];

  return jsonResponse({
    ok: true,
    nome_ja: jaResults[0],
    desc_ja: jaResults[1],
    ingredientes_ja: toArray(jaResults[2]),
    nome_en: enResults[0],
    desc_en: enResults[1],
    ingredientes_en: toArray(enResults[2]),
  });
});
