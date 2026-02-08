import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

function formatNumeroPedido(num: number | null | undefined): string {
  const n = num == null ? 0 : Number(num);
  return "A-" + String(n).padStart(3, "0");
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

  // Auth: aceita (1) segredo ADMIN_SECRET no header x-admin-secret OU (2) JWT do Supabase Auth
  const adminSecret = Deno.env.get("ADMIN_SECRET");
  const sentSecret = (req.headers.get("x-admin-secret") || "").trim();
  if (adminSecret && sentSecret && adminSecret === sentSecret) {
    // Autenticado por segredo
  } else {
    if (sentSecret) {
      if (!adminSecret) {
        console.warn("mark-order-ready: x-admin-secret enviado mas ADMIN_SECRET não está definido no Supabase. Adicione o secret e faça deploy de novo.");
        return jsonResponse({ error: "Unauthorized", hint: "ADMIN_SECRET não está no Supabase ou a função não foi deployada depois de adicionar. Edge Functions → Secrets → ADMIN_SECRET, depois deploy." }, 401);
      }
      console.warn("mark-order-ready: segredo não confere.");
      return jsonResponse({ error: "Unauthorized", hint: "Segredo (adminSecret no config) não confere com ADMIN_SECRET no Supabase. Mesmo valor nos dois?" }, 401);
    }
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized", hint: "Envie x-admin-secret (adicione adminSecret em config.js) ou faça login no admin." }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authRes = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: {
        Authorization: authHeader,
        apikey: serviceRoleKey,
      },
    });
    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error("Auth validation failed:", authRes.status, errText);
      return jsonResponse({ error: "Unauthorized", hint: "JWT rejeitado. Use adminSecret em config.js igual ao ADMIN_SECRET no Supabase." }, 401);
    }
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

  const channelToken = Deno.env.get("CHANNEL_ACCESS_TOKEN");
  console.log("mark-order-ready chamado", { pedidoId, hasToken: !!channelToken });

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
  console.log("mark-order-ready pedido", {
    pedidoId,
    numero: pedido.numero,
    hasLineUserId: !!pedido.line_user_id,
  });

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

  let lineSent = false;
  let lineReason: string | undefined;
  if (!channelToken) {
    lineReason = "CHANNEL_ACCESS_TOKEN não configurado no Supabase (Edge Functions → Secrets).";
    console.warn("mark-order-ready: " + lineReason);
  } else if (!pedido.line_user_id) {
    lineReason = "Pedido sem line_user_id (cliente pode ter aberto fora do LIFF ou página do carrinho não obteve o perfil LINE).";
    console.warn("mark-order-ready: pedido_id=" + pedidoId + " " + lineReason);
  } else {
    const lineBody = {
      to: pedido.line_user_id,
      messages: [
        {
          type: "text",
          text: `Seu pedido ${formatNumeroPedido(pedido.numero)} está pronto! Venha buscar.`,
        },
      ],
    };
    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelToken}`,
      },
      body: JSON.stringify(lineBody),
    });
    lineSent = lineRes.ok;
    const lineResText = await lineRes.text();
    if (!lineRes.ok) {
      lineReason = "LINE API retornou " + lineRes.status + ": " + lineResText;
      console.error("LINE push failed:", lineRes.status, lineResText);
    } else {
      console.log("LINE push ok para", pedido.line_user_id);
    }
  }

  return jsonResponse({ ok: true, line_sent: lineSent, line_reason: lineReason });
});
