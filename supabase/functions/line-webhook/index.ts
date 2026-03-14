import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CHANNEL_ACCESS_TOKEN = Deno.env.get("CHANNEL_ACCESS_TOKEN") ?? "";
const CHANNEL_SECRET = Deno.env.get("CHANNEL_SECRET") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const CARDAPIO_URL = Deno.env.get("CARDAPIO_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isJapanese(text: string): boolean {
  return /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);
}

function detectLang(text: string): "ja" | "pt" {
  return isJapanese(text) ? "ja" : "pt";
}

function formatNumero(n: number): string {
  return "A-" + String(n).padStart(3, "0");
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!CHANNEL_SECRET) return true;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

async function replyMessage(replyToken: string, messages: object[]) {
  const res = await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) console.error("LINE reply error:", await res.text());
}

async function pushMessage(to: string, messages: object[]) {
  const res = await fetch(LINE_PUSH_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) console.error("LINE push error:", await res.text());
}

// ---------------------------------------------------------------------------
// Mensagem de boas-vindas
// ---------------------------------------------------------------------------

function welcomeMessages(): object[] {
  return [
    {
      type: "text",
      text: "🥟 Olá! Bem-vindo ao Pastel Food Truck!\n\nPosso te ajudar com:\n📋 Cardápio → escreva \"cardápio\"\n🔍 Status do pedido → escreva \"meu pedido\"\n❓ Dúvidas → escreva livremente, ex: \"tem opção sem glúten?\"\n\n🥟 こんにちは！パステル・フードトラックへようこそ！\n\nご案内できること：\n📋 メニュー → \"メニュー\" と入力\n🔍 注文状況 → \"注文確認\" と入力\n❓ 質問 → 自由に入力してください",
    },
    {
      type: "template",
      altText: "Ver Cardápio / メニューを見る",
      template: {
        type: "buttons",
        text: "Toque para acessar o cardápio 👇\nメニューはこちら 👇",
        actions: [
          {
            type: "uri",
            label: "📋 Ver Cardápio / メニュー",
            uri: CARDAPIO_URL,
          },
        ],
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Contexto do menu para a IA
// ---------------------------------------------------------------------------

async function getMenuContext(): Promise<string> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?ativo_no_catalogo=eq.true&select=nome,nome_ja,preco_padrao,ingredientes_pt,ingredientes_ja,alergenicos_texto_pt,alergenicos_texto_ja,popular&order=ordem`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res.ok) return "";
    const items: any[] = await res.json();
    return items
      .map((i) => {
        const preco = i.preco_padrao ? `¥${i.preco_padrao}` : "";
        const alergenicosJa = i.alergenicos_texto_ja?.join("、") ?? "";
        const alergenicospt = i.alergenicos_texto_pt?.join(", ") ?? "";
        const ingPt = i.ingredientes_pt?.join(", ") ?? "";
        const ingJa = i.ingredientes_ja?.join("、") ?? "";
        return (
          `• ${i.nome} / ${i.nome_ja} ${preco}${i.popular ? " ⭐人気" : ""}` +
          (ingPt ? ` | Ingredientes PT: ${ingPt}` : "") +
          (ingJa ? ` | 材料JA: ${ingJa}` : "") +
          (alergenicospt ? ` | Alérgenos: ${alergenicospt}` : "") +
          (alergenicosJa ? ` | アレルゲン: ${alergenicosJa}` : "")
        );
      })
      .join("\n");
  } catch (e) {
    console.error("getMenuContext error:", e);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Status do pedido
// ---------------------------------------------------------------------------

async function getOrderStatus(
  lineUserId: string
): Promise<{ pedido: { numero: number; status: string }; frente: number } | null> {
  try {
    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/eventos?ativo=eq.true&select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!evRes.ok) return null;
    const eventos: any[] = await evRes.json();
    if (!eventos.length) return null;
    const eventoId = eventos[0].id;

    const pedidoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?evento_id=eq.${eventoId}&line_user_id=eq.${lineUserId}&status=neq.pronto&order=criado_em.desc&limit=1&select=id,numero,status`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!pedidoRes.ok) return null;
    const pedidos: any[] = await pedidoRes.json();
    if (!pedidos.length) return null;
    const pedido = pedidos[0];

    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?evento_id=eq.${eventoId}&status=neq.pronto&numero=lt.${pedido.numero}&select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const frente = countRes.ok ? (await countRes.json()).length : 0;

    return { pedido, frente };
  } catch (e) {
    console.error("getOrderStatus error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Resposta via Groq
// ---------------------------------------------------------------------------

async function handleAI(text: string, lang: "ja" | "pt", replyToken: string) {
  const menuContext = await getMenuContext();

  const systemPrompt =
    lang === "ja"
      ? `あなたは「パステル・フードトラック」のAIアシスタントです。
お客様の質問に丁寧な日本語で答えてください。
回答は簡潔に3〜4文以内でお願いします。

【メニュー情報】
${menuContext}

【重要】注文受付・決済はこのチャットではできません。注文はメニューリンクからお願いします。`
      : `Você é o assistente virtual do Pastel Food Truck.
Responda de forma amigável e objetiva em português, com no máximo 3-4 frases.

【Cardápio】
${menuContext}

【Importante】Pedidos não podem ser feitos pelo chat. Para pedir, use o link do cardápio.`;

  const groqRes = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!groqRes.ok) {
    console.error("Groq error:", await groqRes.text());
    const fallback =
      lang === "ja"
        ? "申し訳ありません、現在応答できません。しばらくしてからもう一度お試しください。"
        : "Desculpe, não consegui responder agora. Tente novamente em instantes.";
    await replyMessage(replyToken, [{ type: "text", text: fallback }]);
    return;
  }

  const groqData = await groqRes.json();
  const aiText =
    groqData.choices?.[0]?.message?.content ??
    (lang === "ja" ? "申し訳ありません。" : "Não entendi, tente novamente.");

  await replyMessage(replyToken, [{ type: "text", text: aiText }]);
}

// ---------------------------------------------------------------------------
// Roteamento de intenção
// ---------------------------------------------------------------------------

function isCardapioRequest(text: string): boolean {
  return /card[aá]pio|menu|メニュー/i.test(text);
}

function isPedidoStatusRequest(text: string): boolean {
  return /meu pedido|status|fila|注文確認|注文状況|注文番号/i.test(text);
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // LINE envia GET para validar o webhook
  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (CHANNEL_SECRET && !(await verifySignature(rawBody, signature))) {
    console.warn("line-webhook: assinatura inválida");
    return new Response("Unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  for (const event of body.events ?? []) {
    try {
      if (event.type === "follow") {
        await pushMessage(event.source.userId, welcomeMessages());
      } else if (event.type === "message" && event.message?.type === "text") {
        const text = (event.message.text as string).trim();
        const lang = detectLang(text);
        const userId = event.source.userId as string;
        const replyToken = event.replyToken as string;

        if (isCardapioRequest(text)) {
          const msg =
            lang === "ja"
              ? `📋 メニューはこちら:\n${CARDAPIO_URL}`
              : `📋 Acesse o cardápio:\n${CARDAPIO_URL}`;
          await replyMessage(replyToken, [{ type: "text", text: msg }]);
        } else if (isPedidoStatusRequest(text)) {
          const result = await getOrderStatus(userId);
          if (!result) {
            const msg =
              lang === "ja"
                ? "現在、処理中のご注文は見つかりませんでした。"
                : "Nenhum pedido em andamento encontrado para o seu usuário.";
            await replyMessage(replyToken, [{ type: "text", text: msg }]);
          } else {
            const { pedido, frente } = result;
            const msg =
              lang === "ja"
                ? frente === 0
                  ? `✅ ご注文 ${formatNumero(pedido.numero)} は次の順番です！まもなくご用意します。`
                  : `🕐 ご注文 ${formatNumero(pedido.numero)} は準備中です。\nあなたの前に ${frente} 件あります。`
                : frente === 0
                ? `✅ Seu pedido ${formatNumero(pedido.numero)} é o próximo! Prepare-se.`
                : `🕐 Seu pedido ${formatNumero(pedido.numero)} está na fila.\nExistem ${frente} pedido${frente > 1 ? "s" : ""} na sua frente.`;
            await replyMessage(replyToken, [{ type: "text", text: msg }]);
          }
        } else {
          await handleAI(text, lang, replyToken);
        }
      }
    } catch (e) {
      console.error("Erro ao processar evento:", e);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
