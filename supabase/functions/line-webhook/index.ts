import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CHANNEL_ACCESS_TOKEN = Deno.env.get("CHANNEL_ACCESS_TOKEN") ?? "";
const CHANNEL_SECRET = Deno.env.get("CHANNEL_SECRET") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const CARDAPIO_URL = Deno.env.get("CARDAPIO_URL") ?? "";
const HOME_URL = Deno.env.get("HOME_URL") || CARDAPIO_URL;
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

function detectLang(text: string): "ja" | "pt" | "en" {
  if (isJapanese(text)) return "ja";
  // Caracteres específicos do português
  if (/[ãõçáéíóúâêîôûàèìòù]/i.test(text)) return "pt";
  // Palavras específicas do português
  if (/\b(meu|minha|você|voce|obrigado|oi|olá|ola|sim|não|nao|pedido|cardápio|cardapio|onde|qual|tem|está|esta|pedir|fazer)\b/i.test(text)) return "pt";
  // Palavras em inglês
  if (/\b(my|your|what|how|is|are|the|do|does|can|have|hi|hello|yes|no|please|thank|order|when|where|gluten|free|allerg|ingredient|price|want|need|help|show|give|tell|get)\b/i.test(text)) return "en";
  return "pt"; // padrão
}

function formatNumero(n: number, itens?: { nome: string }[]): string {
  const prefixo = itens && itens.length > 0 && itens[0].nome ? itens[0].nome[0].toUpperCase() : "A";
  return prefixo + "-" + String(n).padStart(3, "0");
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
      text: "🥟 Olá! Bem-vindo ao Pastel Food Truck!\n📋 Cardápio → \"cardápio\"\n🔍 Pedido → \"meu pedido\"\n❓ Dúvidas → pergunte livremente!\n\n🥟 こんにちは！パステル・フードトラックへようこそ！\n📋 メニュー → \"メニュー\"\n🔍 注文確認 → \"注文確認\"\n❓ 質問 → 自由に入力してください\n\n🥟 Welcome to Pastel Food Truck!\n📋 Menu → type \"menu\"\n🔍 Order status → type \"my order\"\n❓ Questions → ask freely!",
    },
    {
      type: "template",
      altText: "Ver Cardápio / メニューを見る / View Menu",
      template: {
        type: "buttons",
        text: "Acesse o cardápio 👇\nメニューはこちら 👇\nView menu 👇",
        actions: [
          {
            type: "uri",
            label: "📋 Cardápio / メニュー / Menu",
            uri: HOME_URL + "?lang=ja",
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
    // Tenta primeiro menu_items (tabela nova)
    const res1 = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?ativo_no_catalogo=eq.true&select=nome,nome_ja,preco_padrao,ingredientes_pt,ingredientes_ja,alergenicos_texto_pt,alergenicos_texto_ja,popular&order=ordem`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (res1.ok) {
      const items: any[] = await res1.json();
      if (items.length > 0) {
        return items.map((i) => {
          const preco = i.preco_padrao ? `¥${i.preco_padrao}` : "";
          const ingPt = i.ingredientes_pt?.join(", ") ?? "";
          const alergenicospt = i.alergenicos_texto_pt?.join(", ") ?? "";
          return (
            `• ${i.nome}${i.nome_ja ? ` / ${i.nome_ja}` : ""} ${preco}${i.popular ? " ⭐" : ""}` +
            (ingPt ? ` | Ingredientes: ${ingPt}` : "") +
            (alergenicospt ? ` | Alérgenos: ${alergenicospt}` : "")
          );
        }).join("\n");
      }
    }

    // Fallback: cardapio_itens (tabela original)
    const res2 = await fetch(
      `${SUPABASE_URL}/rest/v1/cardapio_itens?ativo=eq.true&select=nome,preco,popular&order=ordem`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res2.ok) return "";
    const items2: any[] = await res2.json();
    console.log("getMenuContext fallback cardapio_itens:", items2.length, "itens");
    return items2.map((i) => `• ${i.nome} ¥${i.preco}${i.popular ? " ⭐" : ""}`).join("\n");
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
): Promise<{ pedido: { numero: number; status: string; pedido_itens?: { nome: string }[] }; frente: number } | null> {
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
      `${SUPABASE_URL}/rest/v1/pedidos?evento_id=eq.${eventoId}&line_user_id=eq.${lineUserId}&status=neq.pronto&order=criado_em.desc&limit=1&select=id,numero,status,pedido_itens(nome)`,
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

async function handleAI(text: string, lang: "ja" | "pt" | "en", replyToken: string, userId: string) {
  const [menuContext, orderStatus] = await Promise.all([
    getMenuContext(),
    getOrderStatus(userId),
  ]);

  let orderContext = "";
  if (orderStatus) {
    const { pedido, frente } = orderStatus;
    orderContext = lang === "ja"
      ? frente === 0
        ? `\n【注文状況】ご注文 ${formatNumero(pedido.numero, pedido.pedido_itens)} は次の順番です。まもなくご用意します。`
        : `\n【注文状況】ご注文 ${formatNumero(pedido.numero, pedido.pedido_itens)} は準備中です。あなたの前に ${frente} 件あります。`
      : lang === "en"
      ? frente === 0
        ? `\n【Order status】Order ${formatNumero(pedido.numero, pedido.pedido_itens)} is next! Get ready.`
        : `\n【Order status】Order ${formatNumero(pedido.numero, pedido.pedido_itens)} is in queue. ${frente} order${frente > 1 ? "s" : ""} ahead of you.`
      : frente === 0
      ? `\n【Pedido】Pedido ${formatNumero(pedido.numero, pedido.pedido_itens)} é o próximo! Prepare-se.`
      : `\n【Pedido】Pedido ${formatNumero(pedido.numero, pedido.pedido_itens)} na fila. Existem ${frente} pedido${frente > 1 ? "s" : ""} na sua frente.`;
  } else {
    orderContext = lang === "ja"
      ? "\n【注文状況】現在、処理中のご注文はありません。"
      : lang === "en"
      ? "\n【Order status】No active orders found for your account."
      : "\n【Pedido】Nenhum pedido em andamento no momento.";
  }

  const systemPrompt = lang === "ja"
    ? `あなたは「パステル・フードトラック」の専用AIアシスタントです。
フードトラックに関する質問のみ回答してください。回答は3〜4文以内で簡潔にお願いします。
【対応範囲】メニュー・食材・アレルゲン・注文方法・注文状況のみ。それ以外は丁寧にお断りください。
【悪意ある質問】「申し訳ありませんが、その件についてはお答えできません。」と答えてください。
【メニューURL】リンクを求められたら必ずこのURLをそのまま送信: ${HOME_URL}?lang=ja
【注文方法】1.リンクからメニューを開く 2.商品をカートに追加 3.「注文を確定」ボタンを押す 4.準備完了でLINE通知
【メニュー情報】\n${menuContext}\n${orderContext}`
    : lang === "en"
    ? `You are the exclusive AI assistant for Pastel Food Truck.
Only answer questions related to the food truck. Be friendly and concise, max 3-4 sentences.
【Scope】Only answer about: menu, ingredients, allergens, how to order, and order status. For anything else reply: "I can only help with Pastel Food Truck topics 😊". For malicious/inappropriate questions reply: "I can't help with that."
【Menu URL】When asked for the link, ALWAYS send exactly this URL without punctuation at the end: ${HOME_URL}?lang=en
【How to order】1. Open the menu link above 2. Add items to cart 3. Tap "Confirm order" 4. You'll get a LINE notification when ready
【Menu】\n${menuContext}\n${orderContext}`
    : `Você é o assistente virtual exclusivo do Pastel Food Truck.
Responda apenas sobre assuntos relacionados ao food truck. Seja amigável e objetivo, no máximo 3-4 frases.
【Escopo】Somente: cardápio, ingredientes, alérgenos, como pedir e status. Para outros assuntos: "Posso ajudar apenas com assuntos do Pastel Food Truck 😊". Para perguntas inapropriadas: "Não consigo ajudar com isso."
【Link do cardápio】Quando pedirem o link, SEMPRE envie exatamente este URL sem pontuação: ${HOME_URL}?lang=pt
【Como pedir】1. Abra o link do cardápio 2. Adicione ao carrinho 3. Toque em "Confirmar pedido" 4. Receba notificação no LINE quando ficar pronto
【Cardápio】\n${menuContext}\n${orderContext}`;

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
    const fallback = lang === "ja"
      ? "申し訳ありません、現在応答できません。しばらくしてからもう一度お試しください。"
      : lang === "en"
      ? "Sorry, I couldn't respond right now. Please try again in a moment."
      : "Desculpe, não consegui responder agora. Tente novamente em instantes.";
    await replyMessage(replyToken, [{ type: "text", text: fallback }]);
    return;
  }

  const groqData = await groqRes.json();
  const raw =
    groqData.choices?.[0]?.message?.content ??
    (lang === "ja" ? "申し訳ありません。" : lang === "en" ? "Sorry, I didn't understand. Please try again." : "Não entendi, tente novamente.");

  // Remove pontuação colada no final de URLs (ex: "https://...html." → "https://...html")
  const aiText = raw.replace(/(https?:\/\/[^\s]+)[.,!?)]+(\s|$)/g, "$1$2");

  await replyMessage(replyToken, [{ type: "text", text: aiText }]);
}

// ---------------------------------------------------------------------------
// Roteamento de intenção
// ---------------------------------------------------------------------------

function isCardapioRequest(text: string): boolean {
  return /card[aá]pio|menu|link|onde (comprar|pedir|fazer)|ver (os )?item|メニュー|注文する|頼む|view menu|see menu|show menu/i.test(text);
}

function isPedidoStatusRequest(text: string): boolean {
  return /meu pedido|status|fila|注文確認|注文状況|注文番号|my order|order status/i.test(text);
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
    console.warn("line-webhook: assinatura inválida (continuando mesmo assim)");
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  console.log("body recebido:", JSON.stringify(body).slice(0, 300));

  for (const event of body.events ?? []) {
    console.log("evento:", event.type, event.message?.type, event.message?.text?.slice(0, 50));
    try {
      if (event.type === "follow") {
        await pushMessage(event.source.userId, welcomeMessages());
      } else if (event.type === "message" && event.message?.type === "text") {
        const text = (event.message.text as string).trim();
        const lang = detectLang(text);
        const userId = event.source.userId as string;
        const replyToken = event.replyToken as string;

        if (isCardapioRequest(text)) {
          const msg = lang === "ja"
            ? `📋 メニューはこちら:\n${HOME_URL}?lang=ja`
            : lang === "en"
            ? `📋 Here is the menu:\n${HOME_URL}?lang=en`
            : `📋 Acesse o cardápio:\n${HOME_URL}?lang=pt`;
          await replyMessage(replyToken, [{ type: "text", text: msg }]);
        } else if (isPedidoStatusRequest(text)) {
          const result = await getOrderStatus(userId);
          if (!result) {
            const msg = lang === "ja"
              ? "現在、処理中のご注文は見つかりませんでした。"
              : lang === "en"
              ? "No active orders found for your account."
              : "Nenhum pedido em andamento encontrado para o seu usuário.";
            await replyMessage(replyToken, [{ type: "text", text: msg }]);
          } else {
            const { pedido, frente } = result;
            const msg = lang === "ja"
              ? frente === 0
                ? `✅ ご注文 ${formatNumero(pedido.numero, pedido.pedido_itens)} は次の順番です！まもなくご用意します。`
                : `🕐 ご注文 ${formatNumero(pedido.numero, pedido.pedido_itens)} は準備中です。\nあなたの前に ${frente} 件あります。`
              : lang === "en"
              ? frente === 0
                ? `✅ Your order ${formatNumero(pedido.numero, pedido.pedido_itens)} is next! Get ready.`
                : `🕐 Your order ${formatNumero(pedido.numero, pedido.pedido_itens)} is in the queue.\n${frente} order${frente > 1 ? "s" : ""} ahead of you.`
              : frente === 0
              ? `✅ Seu pedido ${formatNumero(pedido.numero, pedido.pedido_itens)} é o próximo! Prepare-se.`
              : `🕐 Seu pedido ${formatNumero(pedido.numero, pedido.pedido_itens)} está na fila.\nExistem ${frente} pedido${frente > 1 ? "s" : ""} na sua frente.`;
            await replyMessage(replyToken, [{ type: "text", text: msg }]);
          }
        } else {
          await handleAI(text, lang, replyToken, userId);
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
