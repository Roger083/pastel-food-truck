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

// Termos que devem ser preservados na tradução
const PROTECTED_TERMS: { pt: string; ja: string; en: string }[] = [
  { pt: "Pastel",      ja: "パステル",       en: "Pastel"      },
  { pt: "Pastelzinho", ja: "パステルジーニョ", en: "Pastelzinho" },
  { pt: "Coxinha",     ja: "コシーニャ",      en: "Coxinha"     },
  { pt: "Pão de Queijo", ja: "ポンデケージョ", en: "Pão de Queijo" },
];

function protectTerms(text: string): { protected: string; map: { placeholder: string; ja: string; en: string }[] } {
  let result = text;
  const map: { placeholder: string; ja: string; en: string }[] = [];
  PROTECTED_TERMS.forEach((term, i) => {
    const placeholder = `__TERM${i}__`;
    const regex = new RegExp(term.pt, "gi");
    if (regex.test(result)) {
      result = result.replace(new RegExp(term.pt, "gi"), placeholder);
      map.push({ placeholder, ja: term.ja, en: term.en });
    }
  });
  return { protected: result, map };
}

function restoreTerms(text: string, map: { placeholder: string; ja: string; en: string }[], lang: "ja" | "en"): string {
  let result = text;
  map.forEach(({ placeholder, ja, en }) => {
    result = result.replace(new RegExp(placeholder, "gi"), lang === "ja" ? ja : en);
  });
  return result;
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

  const rawTexts = [nome_pt, desc_pt || "", ingredientes_pt || ""];

  // Protege termos específicos antes de traduzir
  const processed = rawTexts.map(t => protectTerms(t));
  const textsToSend = processed.map(p => p.protected);

  // Traduz para JA e EN em paralelo
  const [jaResults, enResults] = await Promise.all([
    deepLTranslate(textsToSend, "JA"),
    deepLTranslate(textsToSend, "EN-US"),
  ]);

  // Restaura os termos protegidos
  const toArray = (s: string) =>
    s ? s.split(",").map(x => x.trim()).filter(Boolean) : [];

  return jsonResponse({
    ok: true,
    nome_ja: restoreTerms(jaResults[0], processed[0].map, "ja"),
    desc_ja: restoreTerms(jaResults[1], processed[1].map, "ja"),
    ingredientes_ja: toArray(restoreTerms(jaResults[2], processed[2].map, "ja")),
    nome_en: restoreTerms(enResults[0], processed[0].map, "en"),
    desc_en: restoreTerms(enResults[1], processed[1].map, "en"),
    ingredientes_en: toArray(restoreTerms(enResults[2], processed[2].map, "en")),
  });
});
