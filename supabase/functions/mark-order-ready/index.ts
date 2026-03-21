import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

function formatNumeroPedido(num: number | null | undefined, itens?: { nome: string }[]): string {
  const n = num == null ? 0 : Number(num);
  const prefixo = itens && itens.length > 0 && itens[0].nome ? itens[0].nome[0].toUpperCase() : "A";
  return prefixo + "-" + String(n).padStart(3, "0");
}

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
  const channelToken = Deno.env.get("CHANNEL_ACCESS_TOKEN");
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

  console.log("mark-order-ready chamado", { pedidoId, hasToken: !!channelToken });

  // Busca pedido
  const resGet = await fetch(
    `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}&select=id,numero,line_user_id`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  if (!resGet.ok) return jsonResponse({ error: "Failed to get order" }, 500);

  const rows = await resGet.json();
  const pedido = rows[0];
  if (!pedido) return jsonResponse({ error: "Order not found" }, 404);

  // Busca primeiro item separadamente para garantir o prefixo correto
  const resItens = await fetch(
    `${supabaseUrl}/rest/v1/pedido_itens?pedido_id=eq.${pedidoId}&select=nome&order=id.asc&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  const itens = resItens.ok ? await resItens.json() : [];

  console.log("mark-order-ready pedido", { pedidoId, numero: pedido.numero, itens, hasLineUserId: !!pedido.line_user_id });

  // Atualiza status
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

  // Envia notificação LINE
  let lineSent = false;
  let lineReason: string | undefined;

  if (!channelToken) {
    lineReason = "CHANNEL_ACCESS_TOKEN não configurado.";
    console.warn("mark-order-ready: " + lineReason);
  } else if (!pedido.line_user_id) {
    lineReason = "Pedido sem line_user_id.";
    console.warn("mark-order-ready: pedido_id=" + pedidoId + " " + lineReason);
  } else {
    const codigoPedido = formatNumeroPedido(pedido.numero, itens);
    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${channelToken}` },
      body: JSON.stringify({
        to: pedido.line_user_id,
        messages: [{ type: "text", text: `Seu pedido ${codigoPedido} está pronto! Venha buscar. 🥟` }],
      }),
    });
    lineSent = lineRes.ok;
    const lineResText = await lineRes.text();
    if (!lineRes.ok) {
      lineReason = "LINE API retornou " + lineRes.status + ": " + lineResText;
      console.error("LINE push failed:", lineRes.status, lineResText);
    } else {
      console.log("LINE push ok para", pedido.line_user_id, "pedido", codigoPedido);
    }
  }

  return jsonResponse({ ok: true, line_sent: lineSent, line_reason: lineReason });
});
