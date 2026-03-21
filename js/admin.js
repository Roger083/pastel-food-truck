import { getSupabase as getSharedSupabase } from "./admin-auth.js";

const CONFIG = window.FOOD_TRUCK_CONFIG;
const $login = document.getElementById("admin-login");
const $dashboard = document.getElementById("admin-dashboard");
const $emailInput = document.getElementById("admin-email");
const $passwordInput = document.getElementById("admin-password");
const $btnLogin = document.getElementById("btn-admin-login");
const $loginError = document.getElementById("admin-login-error");
const $eventName = document.getElementById("event-name");
const $btnLogout = document.getElementById("btn-admin-logout");
const $ordersLoading = document.getElementById("orders-loading");
const $ordersList = document.getElementById("orders-list");
const $feedback = document.getElementById("admin-feedback");
const $btnZerar = document.getElementById("btn-zerar-pedidos");
const $stats = document.getElementById("admin-stats");
const $statPendentes = document.getElementById("stat-pendentes");
const $statProntos = document.getElementById("stat-prontos");
const $statTotal = document.getElementById("stat-total");

let currentEventoId = null;

/** Formato do número do pedido: P-001, C-002, ... (prefixo = 1ª letra do 1º item) */
function formatoNumeroPedido(num, itens) {
  const n = num == null ? 0 : Number(num);
  const prefixo = itens && itens.length > 0 && itens[0].nome ? itens[0].nome[0].toUpperCase() : "A";
  return prefixo + "-" + String(n).padStart(3, "0");
}

let realtimeChannel = null;
let realtimeEventoId = null;
let pollInterval = null;

function getSupabase() {
  return getSharedSupabase();
}

function startRealtime(eventoId) {
  if (realtimeEventoId === eventoId && realtimeChannel) return;
  stopRealtime();
  const sb = getSupabase();
  if (!sb) return;
  realtimeChannel = sb
    .channel("admin-pedidos-" + eventoId)
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos", filter: `evento_id=eq.${eventoId}` }, () => loadOrders())
    .subscribe();
  realtimeEventoId = eventoId;
}

function stopRealtime() {
  if (!realtimeChannel) return;
  const sb = getSupabase();
  if (sb) sb.removeChannel(realtimeChannel);
  realtimeChannel = null;
  realtimeEventoId = null;
}

function startPoll() {
  if (pollInterval) return;
  pollInterval = setInterval(loadOrders, 10000);
}

function stopPoll() {
  if (!pollInterval) return;
  clearInterval(pollInterval);
  pollInterval = null;
}

function functionsUrl(path) {
  const base = (CONFIG?.supabaseUrl || "").replace(/\/rest\/v1\/?$/, "");
  return base + "/functions/v1" + path;
}

function showLogin(err) {
  $dashboard.hidden = true;
  $login.hidden = false;
  $loginError.textContent = err || "";
  $loginError.hidden = !err;
  stopRealtime();
  stopPoll();
  if ($stats) $stats.hidden = true;
}

function showDashboard() {
  $login.hidden = true;
  $dashboard.hidden = false;
  $loginError.hidden = true;
  loadOrders();
  startPoll();
}

async function loadOrders() {
  const sb = getSupabase();
  if (!sb) {
    $ordersLoading.textContent = "Configure o Supabase em config.js.";
    return;
  }

  const { data: evento, error: errEvento } = await sb
    .from("eventos")
    .select("id, nome")
    .eq("ativo", true)
    .maybeSingle();

  if (errEvento) {
    $ordersLoading.textContent = "Falha ao carregar.";
    return;
  }
  if (!evento) {
    $eventName.textContent = "(Nenhum evento ativo)";
    $ordersList.innerHTML = "";
    $ordersLoading.hidden = true;
    $btnZerar.hidden = true;
    currentEventoId = null;
    return;
  }

  currentEventoId = evento.id;
  startRealtime(evento.id);

  // Pedidos na hora: sempre. Agendados: só entram na fila 30 min antes do horário.
  const cutoffAgendado = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  
  // Buscar pedidos separados: pendentes (ASC - mais antigo primeiro) e prontos (DESC - mais recente primeiro)
  const { data: pedidosPendentes, error: errPendentes } = await sb
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .eq("evento_id", evento.id)
    .neq("status", "pronto")
    .or(`agendado_para.is.null,agendado_para.lte.${cutoffAgendado}`)
    .order("criado_em", { ascending: true });

  const { data: pedidosProntos, error: errProntos } = await sb
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .eq("evento_id", evento.id)
    .eq("status", "pronto")
    .order("criado_em", { ascending: false });

  if (errPendentes || errProntos) {
    $ordersLoading.textContent = "Falha ao carregar.";
    return;
  }

  $ordersLoading.hidden = true;
  $eventName.textContent = evento.nome || "(Sem nome)";

  // Estatísticas
  const totalPendentes = (pedidosPendentes || []).length;
  const totalProntos = (pedidosProntos || []).length;
  const prontoComTempo = (pedidosProntos || []).filter(p => p.pronto_em && p.criado_em);
  let tempoMedioMin = null;
  if (prontoComTempo.length > 0) {
    const avgMs = prontoComTempo.reduce((s, p) => s + (new Date(p.pronto_em) - new Date(p.criado_em)), 0) / prontoComTempo.length;
    tempoMedioMin = Math.round(avgMs / 60000);
  }
  if ($stats) {
    $statPendentes.textContent = totalPendentes;
    $statProntos.textContent = totalProntos;
    $statTotal.textContent = totalPendentes + totalProntos;
    $stats.hidden = false;
  }

  // Combinar: pendentes primeiro (mais antigo no topo), depois prontos
  const orders = [...(pedidosPendentes || []), ...(pedidosProntos || [])];

  $ordersList.innerHTML = orders
    .map(function (p, index) {
      const itens = p.pedido_itens || [];
      const itemsHtml = itens.length
        ? itens.map((i) => '<div class="order-item-row"><span class="item-qty">' + i.quantidade + 'x</span><span class="item-name">' + i.nome + '</span></div>').join("")
        : '<div class="order-item-row"><span class="item-name">(Sem itens)</span></div>';
      const total = itens.reduce((s, i) => s + Number(i.preco || 0) * i.quantidade, 0);
      const totalStr = total > 0 ? "¥" + Math.round(total).toLocaleString() : "";
      const time = p.criado_em
        ? new Date(p.criado_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const agendadoStr = p.agendado_para
        ? "Agendado: " +
          new Date(p.agendado_para).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const isPronto = p.status === "pronto";
      const isPrimeiroPendente = index === 0 && !isPronto;

      return (
        '<li class="order-card' +
        (isPronto ? " pronto" : "") +
        (isPrimeiroPendente ? " primeiro-pendente" : "") +
        '" data-id="' +
        p.id +
        '">' +
        '<div class="order-card-main">' +
          '<div class="order-header">' +
            '<div class="order-num">' + formatoNumeroPedido(p.numero, itens) + '</div>' +
            '<div class="order-header-right">' +
              '<div class="order-time">⏱️ ' + time + '</div>' +
              (!isPronto && !isPrimeiroPendente
                ? '<span class="badge-fila">' + (index + 1) + 'º' + (tempoMedioMin ? ' · ~' + (index + 1) * tempoMedioMin + 'min' : '') + '</span>'
                : "") +
              (isPrimeiroPendente
                ? '<span class="badge-fazer-este">FAZER ESTE!</span>'
                : "") +
            '</div>' +
          '</div>' +
          (agendadoStr ? '<div class="order-agendado">' + agendadoStr + "</div>" : "") +
          '<div class="order-items">' + itemsHtml + '</div>' +
          (totalStr ? '<div class="order-total-footer">' + totalStr + '</div>' : '') +
          '</div>' +
        (isPrimeiroPendente
          ? '<button type="button" class="btn-ready" data-id="' + p.id + '">✓<span>Marcar como pronto</span></button>'
          : "") +
        "</li>"
      );
    })
    .join("");

  $ordersList.querySelectorAll(".btn-ready").forEach(function (btn) {
    btn.addEventListener("click", function () {
      markReady(btn.dataset.id);
    });
  });

  $btnZerar.hidden = false;
}

function showMsg(msg, type) {
  if ($feedback) {
    $feedback.textContent = msg;
    $feedback.className = "admin-feedback " + (type || "success");
    $feedback.hidden = false;
    setTimeout(function () { $feedback.hidden = true; }, 8000);
  }
}

async function markReady(pedidoId) {
  const sb = getSupabase();
  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) {
    showLogin("Sessão expirada. Faça login novamente.");
    return;
  }

  const res = await fetch(functionsUrl("/mark-order-ready"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + session.access_token,
    },
    body: JSON.stringify({ pedido_id: pedidoId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert("Falha ao marcar pronto: " + (err.error || res.status));
    return;
  }

  showMsg("Pedido marcado como pronto! Notificação LINE enviada.", "success");
  loadOrders();
}

$btnLogin.addEventListener("click", async function () {
  const email = ($emailInput?.value || "").trim();
  const password = ($passwordInput?.value || "").trim();
  if (!email || !password) {
    $loginError.textContent = "Digite o e-mail e a senha.";
    $loginError.hidden = false;
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    $loginError.textContent = "Configure o Supabase em config.js.";
    $loginError.hidden = false;
    return;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    $loginError.textContent = "Login falhou: " + (error.message || "E-mail ou senha incorretos.");
    $loginError.hidden = false;
    return;
  }
  $loginError.hidden = true;
  showDashboard();
});

$btnZerar.addEventListener("click", async function () {
  if (!currentEventoId) return;
  if (!confirm("Tem certeza que deseja APAGAR todos os pedidos e zerar a contagem? Esta ação não pode ser desfeita.")) return;

  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    showLogin("Sessão expirada. Faça login novamente.");
    return;
  }

  const { error } = await sb
    .from("pedidos")
    .delete()
    .eq("evento_id", currentEventoId);

  if (error) {
    alert("Falha ao apagar pedidos: " + (error.message || error));
    return;
  }

  loadOrders();
});

$btnLogout.addEventListener("click", async function () {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  $passwordInput.value = "";
  showLogin();
});

(async function init() {
  if (!CONFIG?.supabaseUrl) {
    $loginError.textContent = "Configure a URL do Supabase em config.js.";
    $loginError.hidden = false;
    $ordersLoading.hidden = true;
    return;
  }
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    $ordersLoading.hidden = true;
  }
})();
