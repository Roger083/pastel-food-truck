import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

let supabase = null;
let pollInterval = null;

function getSupabase() {
  if (!supabase && CONFIG?.supabaseUrl && CONFIG?.supabaseAnonKey) {
    supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }
  return supabase;
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
    $ordersLoading.textContent = "config.js に Supabase を設定してください。";
    return;
  }

  const { data: evento, error: errEvento } = await sb
    .from("eventos")
    .select("id, nome")
    .eq("ativo", true)
    .maybeSingle();

  if (errEvento) {
    $ordersLoading.textContent = "読み込みに失敗しました。";
    return;
  }
  if (!evento) {
    $eventName.textContent = "（アクティブなイベントなし）";
    $ordersList.innerHTML = "";
    $ordersLoading.hidden = true;
    return;
  }

  const { data: pedidos, error: errPedidos } = await sb
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .eq("evento_id", evento.id)
    .order("criado_em", { ascending: false });

  if (errPedidos) {
    $ordersLoading.textContent = "読み込みに失敗しました。";
    return;
  }

  $ordersLoading.hidden = true;
  $eventName.textContent = evento.nome || "（イベント名なし）";
  const orders = pedidos || [];

  $ordersList.innerHTML = orders
    .map(function (p) {
      const itens = p.pedido_itens || [];
      const itemsText = itens.map((i) => i.nome + " x" + i.quantidade).join("、");
      const time = p.criado_em
        ? new Date(p.criado_em).toLocaleTimeString("ja-JP", {
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
        '<div class="order-num">#' +
        (p.numero ?? "?") +
        "</div>" +
        '<div class="order-items">' +
        (itemsText || "（内容なし）") +
        "</div>" +
        '<div class="order-time">' +
        time +
        "</div>" +
        (!isPronto
          ? '<button type="button" class="btn-ready" data-id="' +
            p.id +
            '">できあがり</button>'
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
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    showLogin("セッションが切れました。再ログインしてください。");
    return;
  }

  const prontoEm = new Date().toISOString();
  const { error: updateError } = await sb
    .from("pedidos")
    .update({ status: "pronto", pronto_em: prontoEm })
    .eq("id", pedidoId);

  if (updateError) {
    alert("更新に失敗しました: " + (updateError.message || updateError));
    return;
  }

  const res = await fetch(functionsUrl("/mark-order-ready"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    },
    body: JSON.stringify({ pedido_id: pedidoId }),
  });
  if (!res.ok) {
    console.warn("LINE通知の送信に失敗しました（注文は完了済み）");
  }
  loadOrders();
}

$btnLogin.addEventListener("click", async function () {
  const email = ($emailInput?.value || "").trim();
  const password = ($passwordInput?.value || "").trim();
  if (!email || !password) {
    $loginError.textContent = "メールとパスワードを入力してください。";
    $loginError.hidden = false;
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    $loginError.textContent = "config.js に Supabase を設定してください。";
    $loginError.hidden = false;
    return;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    $loginError.textContent = "ログインに失敗しました: " + (error.message || "合言葉が違います");
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
    $loginError.textContent = "config.js に Supabase URL を設定してください。";
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
