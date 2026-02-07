(function () {
  const CONFIG = window.FOOD_TRUCK_CONFIG;
  if (!CONFIG?.liffId || !CONFIG?.supabaseUrl || !CONFIG?.supabaseAnonKey) {
    showError('config.js に LIFF ID と Supabase の設定を入れてください。');
    hideLoading();
    return;
  }

  let supabase;
  let eventoAtivo = null;
  let lineUserId = null;
  const cart = []; // { id, nome, preco, quantidade }

  const $loading = document.getElementById('loading');
  const $error = document.getElementById('error');
  const $main = document.getElementById('main');
  const $menuList = document.getElementById('menu-list');
  const $cartList = document.getElementById('cart-list');
  const $cartCount = document.getElementById('cart-count');
  const $cartTotal = document.getElementById('cart-total');
  const $btnConfirm = document.getElementById('btn-confirm');
  const $successSection = document.getElementById('success-section');
  const $orderNumber = document.getElementById('order-number');

  function hideLoading() {
    $loading.hidden = true;
  }

  function showError(msg) {
    $error.textContent = msg;
    $error.hidden = false;
  }

  function initSupabase() {
    supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }

  function formatPrice(val) {
    return '¥' + Number(val).toLocaleString();
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + Number(item.preco) * item.quantidade, 0);
  }

  function renderCart() {
    $cartList.innerHTML = cart
      .filter((item) => item.quantidade > 0)
      .map(
        (item) =>
          `<li class="cart-item">${item.nome} x${item.quantidade} - ${formatPrice(Number(item.preco) * item.quantidade)}</li>`
      )
      .join('');
    const total = getCartTotal();
    $cartCount.textContent = cart.reduce((n, i) => n + i.quantidade, 0);
    $cartTotal.textContent = '合計: ' + formatPrice(total);
    $btnConfirm.disabled = total <= 0;
  }

  function addToCart(item, delta) {
    let entry = cart.find((c) => c.id === item.id);
    if (!entry) {
      entry = { id: item.id, nome: item.nome, preco: item.preco, quantidade: 0 };
      cart.push(entry);
    }
    entry.quantidade = Math.max(0, entry.quantidade + delta);
    renderCart();
  }

  async function fetchMenu() {
    const { data: eventos, error: errEventos } = await supabase
      .from('eventos')
      .select('id, cardapio_id')
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (errEventos || !eventos) {
      showError('現在、注文を受け付けるイベントがありません。');
      hideLoading();
      return;
    }

    eventoAtivo = eventos;

    const { data: itens, error: errItens } = await supabase
      .from('cardapio_itens')
      .select('id, nome, preco, ordem')
      .eq('cardapio_id', eventos.cardapio_id)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (errItens) {
      showError('メニューの取得に失敗しました。');
      hideLoading();
      return;
    }

    $menuList.innerHTML = (itens || []).map(
      (item) =>
        `<li class="menu-item">
          <span class="name">${escapeHtml(item.nome)}</span>
          <span class="price">${formatPrice(item.preco)}</span>
          <div class="qty-controls">
            <button type="button" data-action="minus" data-id="${item.id}" data-nome="${escapeAttr(item.nome)}" data-preco="${item.preco}">−</button>
            <span class="qty" data-id="${item.id}">0</span>
            <button type="button" data-action="plus" data-id="${item.id}" data-nome="${escapeAttr(item.nome)}" data-preco="${item.preco}">+</button>
          </div>
        </li>`
    );

    $menuList.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', function () {
        const action = this.dataset.action;
        const id = this.dataset.id;
        const nome = this.dataset.nome;
        const preco = this.dataset.preco;
        addToCart({ id, nome, preco }, action === 'plus' ? 1 : -1);
        const li = this.closest('.menu-item');
        const qtyEl = li.querySelector('.qty');
        const entry = cart.find((c) => c.id === id);
        qtyEl.textContent = entry ? entry.quantidade : 0;
      });
    });

    $main.hidden = false;
    hideLoading();
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  async function submitOrder() {
    if (getCartTotal() <= 0) return;
    $btnConfirm.disabled = true;
    $btnConfirm.textContent = '送信中...';

    const itensToInsert = cart.filter((i) => i.quantidade > 0).map((i) => ({
      cardapio_item_id: i.id,
      nome: i.nome,
      preco: i.preco,
      quantidade: i.quantidade
    }));

    const { data: pedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert({
        evento_id: eventoAtivo.id,
        line_user_id: lineUserId || null,
        status: 'pendente'
      })
      .select('id, numero')
      .single();

    if (errPedido || !pedido) {
      const msg = errPedido?.message || '';
      showError('注文の送信に失敗しました。もう一度お試しください。' + (msg ? ' (' + msg + ')' : ''));
      console.error('Pedido insert error:', errPedido);
      $btnConfirm.disabled = false;
      $btnConfirm.textContent = '注文する';
      return;
    }

    const { error: errItens } = await supabase.from('pedido_itens').insert(
      itensToInsert.map((item) => ({
        pedido_id: pedido.id,
        cardapio_item_id: item.cardapio_item_id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade
      }))
    );

    if (errItens) {
      showError('注文内容の保存に失敗しました。番号: ' + (pedido.numero || '?'));
      $btnConfirm.disabled = false;
      $btnConfirm.textContent = '注文する';
      return;
    }

    $main.hidden = true;
    $successSection.hidden = false;
    $orderNumber.textContent = String(pedido.numero);
    $btnConfirm.textContent = '注文する';
    $btnConfirm.disabled = false;
    cart.length = 0;
  }

  $btnConfirm.addEventListener('click', submitOrder);

  async function init() {
    initSupabase();

    if (!window.liff) {
      showError('LINE の LIFF で開いてください。');
      hideLoading();
      return;
    }

    await window.liff.init({ liffId: CONFIG.liffId });

    if (!window.liff.isInClient() && !window.liff.isLoggedIn()) {
      window.liff.login();
      return;
    }

    if (window.liff.isLoggedIn()) {
      const profile = await window.liff.getProfile();
      lineUserId = profile?.userId || null;
    }

    await fetchMenu();
  }

  init();
})();
