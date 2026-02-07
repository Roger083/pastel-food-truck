(function () {
  const CONFIG = window.FOOD_TRUCK_CONFIG;
  const STORAGE_KEY = 'food_truck_admin_secret';

  const $login = document.getElementById('admin-login');
  const $dashboard = document.getElementById('admin-dashboard');
  const $secretInput = document.getElementById('admin-secret');
  const $btnLogin = document.getElementById('btn-admin-login');
  const $loginError = document.getElementById('admin-login-error');
  const $eventName = document.getElementById('event-name');
  const $btnLogout = document.getElementById('btn-admin-logout');
  const $ordersLoading = document.getElementById('orders-loading');
  const $ordersList = document.getElementById('orders-list');

  let adminSecret = '';
  let pollInterval = null;

  function functionsUrl(path) {
    const base = (CONFIG.supabaseUrl || '').replace(/\/rest\/v1\/?$/, '');
    return base + '/functions/v1' + path;
  }

  if (!CONFIG?.supabaseUrl) {
    $loginError.textContent = 'config.js に Supabase URL を設定してください。';
    $loginError.hidden = false;
  }

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Admin-Secret': adminSecret
    };
  }

  function showLogin(err) {
    $dashboard.hidden = true;
    $login.hidden = false;
    $loginError.textContent = err || '';
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
    const res = await fetch(functionsUrl('/list-orders'), { headers: getHeaders() });

    if (res.status === 401) {
      showLogin('合言葉が違うか、期限切れです。');
      return;
    }
    if (!res.ok) {
      $ordersLoading.textContent = '読み込みに失敗しました。';
      return;
    }

    const data = await res.json();
    $ordersLoading.hidden = true;
    $eventName.textContent = data.evento?.nome || '（イベント名なし）';

    const orders = data.pedidos || [];
    $ordersList.innerHTML = orders
      .map(function (p) {
        const itemsText = (p.itens || []).map(function (i) {
          return i.nome + ' x' + i.quantidade;
        }).join('、');
        const time = p.criado_em ? new Date(p.criado_em).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
        const isPronto = p.status === 'pronto';
        return (
          '<li class="order-card' + (isPronto ? ' pronto' : '') + '" data-id="' + p.id + '">' +
          '<div class="order-num">#' + (p.numero ?? '?') + '</div>' +
          '<div class="order-items">' + (itemsText || '（内容なし）') + '</div>' +
          '<div class="order-time">' + time + '</div>' +
          (!isPronto
            ? '<button type="button" class="btn-ready" data-id="' + p.id + '">できあがり</button>'
            : '') +
          '</li>'
        );
      })
      .join('');

    $ordersList.querySelectorAll('.btn-ready').forEach(function (btn) {
      btn.addEventListener('click', function () {
        markReady(btn.dataset.id);
      });
    });
  }

  async function markReady(pedidoId) {
    const res = await fetch(functionsUrl('/mark-order-ready'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pedido_id: pedidoId })
    });

    if (res.status === 401) {
      showLogin('合言葉が違うか、期限切れです。');
      return;
    }
    if (!res.ok) {
      const err = await res.text();
      alert('更新に失敗しました: ' + err);
      return;
    }
    loadOrders();
  }

  $btnLogin.addEventListener('click', async function () {
    const secret = $secretInput.value.trim();
    if (!secret) {
      $loginError.textContent = '合言葉を入力してください。';
      $loginError.hidden = false;
      return;
    }

    adminSecret = secret;
    const res = await fetch(functionsUrl('/list-orders'), { headers: getHeaders() });

    if (res.status === 401) {
      $loginError.textContent = '合言葉が違います。';
      $loginError.hidden = false;
      return;
    }
    if (!res.ok) {
      $loginError.textContent = '接続に失敗しました。';
      $loginError.hidden = false;
      return;
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, secret);
    } catch (e) {}
    showDashboard();
  });

  $btnLogout.addEventListener('click', function () {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    adminSecret = '';
    $secretInput.value = '';
    showLogin();
  });

  (function tryRestore() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && CONFIG?.supabaseUrl) {
        adminSecret = saved;
        showDashboard();
        return;
      }
    } catch (e) {}
    $ordersLoading.hidden = true;
  })();
})();
