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

/** Formato do número do pedido: A-001, A-002, ... */
function formatoNumeroPedido(num) {
  const n = num == null ? 0 : Number(num);
  return "A-" + String(n).padStart(3, "0");
}

let pollInterval = null;

function getSupabase() {
  return getSharedSupabase();
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
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function showDashboard() {
  $login.hidden = true;
  $dashboard.hidden = false;
  $loginError.hidden = true;
  loadOrders();
  pollInterval = setInterval(loadOrders, 5000);
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
    return;
  }

  // Pedidos na hora: sempre. Agendados: só entram na fila 15 min antes do horário.
  const cutoffAgendado = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { data: pedidos, error: errPedidos } = await sb
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .eq("evento_id", evento.id)
    .or(`agendado_para.is.null,agendado_para.lte.${cutoffAgendado}`)
    .order("criado_em", { ascending: false });

  if (errPedidos) {
    $ordersLoading.textContent = "Falha ao carregar.";
    return;
  }

  $ordersLoading.hidden = true;
  $eventName.textContent = evento.nome || "(Sem nome)";
  const orders = pedidos || [];

  $ordersList.innerHTML = orders
    .map(function (p) {
      const itens = p.pedido_itens || [];
      const itemsText = itens.map((i) => i.nome + " x" + i.quantidade).join(", ");
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
      return (
        '<li class="order-card' +
        (isPronto ? " pronto" : "") +
        '" data-id="' +
        p.id +
        '">' +
        '<div class="order-num">' +
        formatoNumeroPedido(p.numero) +
        "</div>" +
        '<div class="order-items">' +
        (itemsText || "(Sem itens)") +
        "</div>" +
        '<div class="order-time">' +
        time +
        "</div>" +
        (agendadoStr ? '<div class="order-agendado">' + agendadoStr + "</div>" : "") +
        (!isPronto
          ? '<button type="button" class="btn-ready" data-id="' +
            p.id +
            '">Marcar pronto</button>'
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
}

async function markReady(pedidoId) {
  const sb = getSupabase();
  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) {
    showLogin("Sessão expirada. Faça login novamente.");
    return;
  }

  const prontoEm = new Date().toISOString();
  const { error: updateError } = await sb
    .from("pedidos")
    .update({ status: "pronto", pronto_em: prontoEm })
    .eq("id", pedidoId);

  if (updateError) {
    alert("Falha ao atualizar: " + (updateError.message || updateError));
    return;
  }

  function showMsg(msg, type) {
    if ($feedback) {
      $feedback.textContent = msg;
      $feedback.className = "admin-feedback " + (type || "success");
      $feedback.hidden = false;
      setTimeout(function () {
        $feedback.hidden = true;
      }, 8000);
    }
  }

  showMsg("Pedido marcado como pronto. A notificação no LINE é enviada automaticamente pelo webhook.", "success");
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
