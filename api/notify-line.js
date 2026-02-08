/**
 * Webhook para notificação LINE quando o pedido fica pronto.
 * Recebe o payload do Supabase Database Webhook (UPDATE em pedidos)
 * e envia a mensagem no LINE.
 *
 * Deploy: Vercel (conecte o repo e defina as variáveis de ambiente).
 * Variáveis: CHANNEL_ACCESS_TOKEN, WEBHOOK_SECRET
 */

function formatNumero(num) {
  const n = num == null ? 0 : Number(num);
  return "A-" + String(n).padStart(3, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["x-webhook-secret"] || "";
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { type, table, record, old_record } = body;
  if (type !== "UPDATE" || table !== "pedidos") {
    return res.status(200).json({ ok: true, skipped: "not pedidos update" });
  }

  if (record?.status !== "pronto") {
    return res.status(200).json({ ok: true, skipped: "status not pronto" });
  }
  if (old_record && old_record.status === "pronto") {
    return res.status(200).json({ ok: true, skipped: "already was pronto" });
  }

  const lineUserId = record?.line_user_id;
  const numero = record?.numero;
  const token = process.env.CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "CHANNEL_ACCESS_TOKEN not set" });
  }
  if (!lineUserId) {
    return res.status(200).json({ ok: true, line_sent: false, reason: "no line_user_id" });
  }

  const text = `Seu pedido ${formatNumero(numero)} está pronto! Venha buscar.`;
  const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });

  const lineSent = lineRes.ok;
  if (!lineRes.ok) {
    const errText = await lineRes.text();
    console.error("LINE push failed:", lineRes.status, errText);
  }

  return res.status(200).json({ ok: true, line_sent: lineSent });
}
