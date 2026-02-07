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

  // TODO: reativar verificação de senha depois de testar
  // const secret = (req.headers.get("x-admin-secret") || "").trim();
  // const adminSecret = (Deno.env.get("ADMIN_SECRET") || "").trim();
  // if (secret !== adminSecret && secret !== "1") {
  //   return jsonResponse({ error: "Unauthorized", code: "WRONG_PASSWORD" }, 401);
  // }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const resEvento = await fetch(
    `${supabaseUrl}/rest/v1/eventos?ativo=eq.true&select=id,nome,cardapio_id&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!resEvento.ok) {
    return jsonResponse({ error: "Failed to fetch event" }, 500);
  }

  const eventos = await resEvento.json();
  const evento = eventos[0];
  if (!evento) {
    return jsonResponse({ evento: null, pedidos: [] });
  }

  const resPedidos = await fetch(
    `${supabaseUrl}/rest/v1/pedidos?evento_id=eq.${evento.id}&select=id,numero,status,criado_em,line_user_id&order=criado_em.asc`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!resPedidos.ok) {
    return jsonResponse({ error: "Failed to fetch orders" }, 500);
  }

  const pedidos = await resPedidos.json();

  const pedidosComItens = await Promise.all(
    pedidos.map(async (p: { id: string }) => {
      const resItens = await fetch(
        `${supabaseUrl}/rest/v1/pedido_itens?pedido_id=eq.${p.id}&select=nome,preco,quantidade`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      );
      const itens = resItens.ok ? await resItens.json() : [];
      return { ...p, itens };
    })
  );

  return jsonResponse({ evento, pedidos: pedidosComItens });
});
