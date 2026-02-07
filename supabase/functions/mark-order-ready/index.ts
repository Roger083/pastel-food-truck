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

  const secret = req.headers.get("x-admin-secret");
  const adminSecret = Deno.env.get("ADMIN_SECRET");
  if (!adminSecret || secret !== adminSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: { pedido_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const pedidoId = body.pedido_id;
  if (!pedidoId) {
    return jsonResponse({ error: "pedido_id required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const channelToken = Deno.env.get("CHANNEL_ACCESS_TOKEN");

  const resGet = await fetch(
    `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}&select=id,numero,line_user_id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!resGet.ok) {
    return jsonResponse({ error: "Failed to get order" }, 500);
  }

  const rows = await resGet.json();
  const pedido = rows[0];
  if (!pedido) {
    return jsonResponse({ error: "Order not found" }, 404);
  }

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

  if (!resUpdate.ok) {
    return jsonResponse({ error: "Failed to update order" }, 500);
  }

  if (channelToken && pedido.line_user_id) {
    const lineBody = {
      to: pedido.line_user_id,
      messages: [
        {
          type: "text",
          text: `注文 #${pedido.numero} ができあがりました。お取りに来てください。`,
        },
      ],
    };
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelToken}`,
      },
      body: JSON.stringify(lineBody),
    });
  }

  return jsonResponse({ ok: true });
});
