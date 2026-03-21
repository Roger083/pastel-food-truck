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
  // Admin secret
  const sentSecret = req.headers.get("x-admin-secret") ?? "";
  if (ADMIN_SECRET && sentSecret === ADMIN_SECRET) return true;

  // JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (res.ok) return true;
  }

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (!(await verifyAuth(req))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: { nome_pt?: string; desc_pt?: string; ingredientes_pt?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { nome_pt, desc_pt, ingredientes_pt } = body;
  if (!nome_pt) return jsonResponse({ error: "nome_pt é obrigatório" }, 400);

  const prompt = `You are a professional translator for a Brazilian food truck called "Pastel Food Truck" operating in Japan.
Translate the following food item information from Portuguese to Japanese and English.
Be accurate with food terminology. Return ONLY a valid JSON object, no extra text.

Portuguese name: "${nome_pt}"
Portuguese description: "${desc_pt || ""}"
Portuguese ingredients: "${ingredientes_pt || ""}"

Return this exact JSON structure:
{
  "nome_ja": "Japanese name",
  "desc_ja": "Japanese description (empty string if no description)",
  "ingredientes_ja": ["ingredient1", "ingredient2"],
  "nome_en": "English name",
  "desc_en": "English description (empty string if no description)",
  "ingredientes_en": ["ingredient1", "ingredient2"]
}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("Groq error:", err);
    return jsonResponse({ error: "Falha na tradução automática" }, 500);
  }

  const groqData = await groqRes.json();
  const content = groqData.choices?.[0]?.message?.content ?? "{}";

  let translated: Record<string, unknown>;
  try {
    translated = JSON.parse(content);
  } catch {
    return jsonResponse({ error: "Resposta inválida do modelo de IA" }, 500);
  }

  return jsonResponse({ ok: true, ...translated });
});
