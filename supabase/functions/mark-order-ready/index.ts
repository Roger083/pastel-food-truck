import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminSecret = Deno.env.get("ADMIN_SECRET");

  // Auth: aceita (1) segredo ADMIN_SECRET no header x-admin-secret OU (2) JWT do Supabase Auth
  const sentSecret = (req.headers.get("x-admin-secret") || "").trim();
  let authed = false;

  if (adminSecret && sentSecret && adminSecret === sentSecret) {
    authed = true;
  } else {
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const authRes = await fetch(supabaseUrl + "/auth/v1/user", {
        headers: { Authorization: authHeader, apikey: serviceRoleKey },
      });
      if (authRes.ok) authed = true;
      else console.error("Auth validation failed:", authRes.status, await authRes.text());
    }
  }

  if (!authed) {
    return jsonResponse({ error: "Unauthorized", hint: "Envie x-admin-secret ou faça login no admin." }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // Suporta { pedido_id } e formato de webhook Supabase { record: { id } }
  const pedidoId = body.pedido_id || body.record?.id;
  if (!pedidoId) {
    return jsonResponse({ error: "pedido_id required" }, 400);
  }

  console.log("mark-order-ready chamado", { pedidoId });

  // Atualiza status — a notificação LINE é enviada pelo trigger do banco (notify-line.js no Vercel)
  const prontoEm = new Date().toISOString();
  const resUpdate = await fetch(
    `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: "pronto", pronto_em: prontoEm }),
    }
  );
  if (!resUpdate.ok) return jsonResponse({ error: "Failed to update order" }, 500);

  return jsonResponse({ ok: true });
});
