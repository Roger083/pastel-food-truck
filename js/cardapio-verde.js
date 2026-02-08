(function () {
  const CONFIG = window.FOOD_TRUCK_CONFIG;
  let supabase;
  let eventoAtivo = null;
  let lineUserId = null;
  let tipoRetirada = "agora"; // "agora" | "agendar"
  const cart = [];

  const $loading = document.getElementById("loading");
  const $error = document.getElementById("error");
  const $main = document.getElementById("main");
  const $menuList = document.getElementById("menu-list");
  const $cartList = document.getElementById("cart-list");
  const $cartCount = document.getElementById("cart-count");
  const $cartTotal = document.getElementById("cart-total");
  const $btnConfirm = document.getElementById("btn-confirm");
  const $successSection = document.getElementById("success-section");
  const $orderNumber = document.getElementById("order-number");
  const $orderMsg = document.getElementById("order-msg");
  const $agendarCampos = document.getElementById("agendar-campos");
  const $agendarData = document.getElementById("agendar-data");
  const $agendarHora = document.getElementById("agendar-hora");

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
    return "R$ " + Number(val).toFixed(2).replace(".", ",");
  }

  function formatNumeroPedido(num) {
    const n = num == null ? 0 : Number(num);
    return "A-" + String(n).padStart(3, "0");
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + Number(item.preco) * item.quantidade, 0);
  }

  function renderCart() {
    $cartList.innerHTML = cart
      .filter((item) => item.quantidade > 0)
      .map(
        (item) =>
          `<li class="cart-item">${escapeHtml(item.nome)} x${item.quantidade} – ${formatPrice(Number(item.preco) * item.quantidade)}</li>`
      )
      .join("");
    $cartCount.textContent = cart.reduce((n, i) => n + i.quantidade, 0);
    $cartTotal.textContent = "Total: " + formatPrice(getCartTotal());
    $btnConfirm.disabled = getCartTotal() <= 0;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
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

  function setMinDate() {
    const today = new Date();
    $agendarData.min = today.toISOString().slice(0, 10);
  }

  function atualizarTipoRetirada(tipo) {
    tipoRetirada = tipo;
    document.querySelectorAll(".btn-tipo").forEach((b) => b.classList.remove("ativo"));
    const btn = document.getElementById(tipo === "agora" ? "btn-agora" : "btn-agendar");
    if (btn) btn.classList.add("ativo");
    $agendarCampos.hidden = tipo !== "agendar";
    if (tipo === "agendar") setMinDate();
  }

  async function fetchMenu() {
    const { data: eventos, error: errEventos } = await supabase
      .from("eventos")
      .select("id, cardapio_id")
      .eq("ativo", true)
      .limit(1)
      .maybeSingle();

    if (errEventos || !eventos) {
      showError("Não há evento aceitando pedidos no momento.");
      hideLoading();
      return;
    }
    eventoAtivo = eventos;

    const { data: itens, error: errItens } = await supabase
      .from("cardapio_itens")
      .select("id, nome, preco, ordem")
      .eq("cardapio_id", eventos.cardapio_id)
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (errItens) {
      showError("Falha ao carregar o cardápio.");
      hideLoading();
      return;
    }

    const lista = itens || [];
    $menuList.innerHTML = lista
      .map(
        (item) =>
          `<li class="menu-item">
            <span class="name">${escapeHtml(item.nome)}</span>
            <span class="price">${formatPrice(item.preco)}</span>
            <div class="qty-controls">
              <button type="button" data-action="minus" data-id="${item.id}" data-nome="${escapeHtml(item.nome).replace(/"/g, "&quot;")}" data-preco="${item.preco}">−</button>
              <span class="qty" data-id="${item.id}">0</span>
              <button type="button" data-action="plus" data-id="${item.id}" data-nome="${escapeHtml(item.nome).replace(/"/g, "&quot;")}" data-preco="${item.preco}">+</button>
            </div>
          </li>`
      )
      .join("");

    $menuList.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const nome = this.dataset.nome;
        const preco = this.dataset.preco;
        addToCart({ id, nome, preco }, this.dataset.action === "plus" ? 1 : -1);
        const li = this.closest(".menu-item");
        const qtyEl = li.querySelector(".qty");
        const entry = cart.find((c) => c.id === id);
        qtyEl.textContent = entry ? entry.quantidade : 0;
      });
    });

    $main.hidden = false;
    hideLoading();
  }

  function getAgendadoParaISO() {
    if (tipoRetirada !== "agendar") return null;
    const data = ($agendarData.value || "").trim();
    const hora = ($agendarHora.value || "").trim();
    if (!data || !hora) return null;
    return new Date(data + "T" + hora + ":00").toISOString();
  }

  async function submitOrder() {
    if (getCartTotal() <= 0) return;
    if (tipoRetirada === "agendar") {
      const iso = getAgendadoParaISO();
      if (!iso) {
        showError("Informe data e horário para agendar.");
        return;
      }
    }

    $btnConfirm.disabled = true;
    $btnConfirm.textContent = "Enviando...";

    const itensToInsert = cart
      .filter((i) => i.quantidade > 0)
      .map((i) => ({
        cardapio_item_id: i.id,
        nome: String(i.nome),
        preco: Number(i.preco),
        quantidade: Number(i.quantidade),
      }));

    const agendadoPara = getAgendadoParaISO();
    const params = {
      p_evento_id: eventoAtivo.id,
      p_line_user_id: lineUserId || null,
      p_itens: itensToInsert,
    };
    if (agendadoPara) params.p_agendado_para = agendadoPara;

    const { data: pedido, error: errPedido } = await supabase.rpc("criar_pedido", params);

    if (errPedido || !pedido) {
      showError("Falha ao enviar pedido. Tente novamente. " + (errPedido?.message || ""));
      $btnConfirm.disabled = false;
      $btnConfirm.textContent = "Confirmar pedido";
      return;
    }

    $main.hidden = true;
    $successSection.hidden = false;
    $orderNumber.textContent = formatNumeroPedido(pedido.numero);
    $orderMsg.textContent = agendadoPara
      ? "Pedido agendado! Guarde o número. Você receberá notificação no LINE quando estiver pronto."
      : "Guarde este número. Quando estiver pronto você receberá notificação no LINE.";
    $btnConfirm.textContent = "Confirmar pedido";
    $btnConfirm.disabled = false;
    cart.length = 0;
  }

  document.getElementById("btn-agora").addEventListener("click", () => atualizarTipoRetirada("agora"));
  document.getElementById("btn-agendar").addEventListener("click", () => atualizarTipoRetirada("agendar"));
  $btnConfirm.addEventListener("click", submitOrder);

  async function init() {
    if (!CONFIG?.liffId || !CONFIG?.supabaseUrl || !CONFIG?.supabaseAnonKey) {
      showError("Configure LIFF e Supabase em config.js.");
      hideLoading();
      return;
    }
    initSupabase();

    if (!window.liff) {
      showError("Abra pelo LINE (LIFF).");
      hideLoading();
      return;
    }
    await window.liff.init({ liffId: CONFIG.liffId });

    if (!window.liff.isInClient() && !window.liff.isLoggedIn()) {
      window.liff.login();
      return;
    }

    if (window.liff.isLoggedIn()) {
      try {
        const profile = await window.liff.getProfile();
        lineUserId = profile?.userId || null;
      } catch (_) {}
    }

    await fetchMenu();
  }

  init();
})();
