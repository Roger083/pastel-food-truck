import { getSupabase, requireAuth, logout } from "./admin-auth.js";

const $loading = document.getElementById("loading");
const $feedback = document.getElementById("feedback");
const $menuContainer = document.getElementById("menu-container");
const $pageTitle = document.getElementById("page-title");
const $modalPreco = document.getElementById("modal-preco");
const $modalItem = document.getElementById("modal-item");
const $inputPreco = document.getElementById("input-preco");
const $modalPrecoNome = document.getElementById("modal-preco-nome");
const $btnSalvar = document.getElementById("btn-salvar");
const $btnUsarEste = document.getElementById("btn-usar-este");
const $navPedidos = document.getElementById("nav-pedidos");
const $btnLogout = document.getElementById("btn-logout");

const params = new URLSearchParams(window.location.search);
const templateId = params.get("template");

// State
let state = {};
let categorias = [];
let editingItemId = null;
let editingCatalogItemId = null; // for item editor modal
let isDirty = false;

function markDirty() {
  isDirty = true;
  $btnSalvar.disabled = false;
  $btnSalvar.textContent = "Salvar";
}

function markClean() {
  isDirty = false;
  $btnSalvar.disabled = true;
  $btnSalvar.textContent = "Salvo";
}

function showMsg(msg, type) {
  $feedback.textContent = msg;
  $feedback.className = "admin-feedback " + (type || "success");
  $feedback.hidden = false;
  setTimeout(() => { $feedback.hidden = true; }, 5000);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

async function loadMenu() {
  const sb = getSupabase();
  $loading.hidden = false;

  // Load all catalog items (including inactive for editing)
  const { data: items, error: errItems } = await sb
    .from("menu_items")
    .select("*")
    .order("ordem", { ascending: true });

  if (errItems) {
    $loading.textContent = "Falha ao carregar items.";
    return;
  }

  // Load categories
  const { data: cats } = await sb
    .from("categorias")
    .select("id, nome_pt, emoji, ordem")
    .order("ordem", { ascending: true });
  categorias = cats || [];

  // Initialize state from catalog
  state = {};
  (items || []).forEach(item => {
    state[item.id] = {
      nome: item.nome,
      nome_ja: item.nome_ja,
      desc_pt: item.desc_pt,
      desc_ja: item.desc_ja,
      preco_padrao: item.preco_padrao,
      foto_url: item.foto_url,
      categoria_id: item.categoria_id,
      ordem: item.ordem,
      popular: item.popular,
      alergenicos_texto_pt: item.alergenicos_texto_pt || [],
      alergenicos_texto_ja: item.alergenicos_texto_ja || [],
      ativo_no_catalogo: item.ativo_no_catalogo,
      checked: false,
      preco_atual: item.preco_padrao
    };
  });

  if (templateId) {
    // Editing a template: load template info + items
    const { data: tmpl } = await sb
      .from("event_templates")
      .select("nome")
      .eq("id", templateId)
      .single();

    $pageTitle.textContent = tmpl ? tmpl.nome : "Editar Template";
    document.title = (tmpl ? tmpl.nome : "Template") + " - Admin";

    // Hide pedidos/sair in template edit mode, show rename
    if ($navPedidos) $navPedidos.style.display = "none";
    if ($btnLogout) $btnLogout.style.display = "none";
    document.getElementById("btn-renomear").hidden = false;

    // Show "Usar Este" button
    $btnUsarEste.hidden = false;

    const { data: tItems } = await sb
      .from("event_template_items")
      .select("item_id, preco_override, ativo, ordem")
      .eq("template_id", templateId);

    if (tItems) {
      tItems.forEach(ti => {
        if (state[ti.item_id]) {
          state[ti.item_id].checked = ti.ativo;
          if (ti.preco_override) {
            state[ti.item_id].preco_atual = ti.preco_override;
          }
        }
      });
    }
  } else {
    // Load active_menu
    const { data: active } = await sb
      .from("active_menu")
      .select("item_id, preco_atual, ativo");

    if (active) {
      active.forEach(a => {
        if (state[a.item_id]) {
          state[a.item_id].checked = a.ativo;
          state[a.item_id].preco_atual = a.preco_atual;
        }
      });
    }
  }

  $loading.hidden = true;
  populateCategorySelect();
  renderMenu();
  markClean();
}

function populateCategorySelect() {
  const $sel = document.getElementById("item-categoria");
  $sel.innerHTML = '<option value="">Sem categoria</option>';
  categorias.forEach(cat => {
    $sel.innerHTML += `<option value="${cat.id}">${cat.emoji || ""} ${escapeHtml(cat.nome_pt)}</option>`;
  });
}

function renderMenu() {
  const items = Object.entries(state)
    .filter(([, s]) => s.ativo_no_catalogo)
    .map(([id, s]) => ({ id, ...s }));

  // Group by category
  const byCat = {};
  const noCat = [];
  items.forEach(item => {
    if (item.categoria_id) {
      if (!byCat[item.categoria_id]) byCat[item.categoria_id] = [];
      byCat[item.categoria_id].push(item);
    } else {
      noCat.push(item);
    }
  });

  let html = "";

  // Render each category
  categorias.forEach(cat => {
    const catItems = byCat[cat.id];
    if (!catItems || catItems.length === 0) return;
    catItems.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    html += '<div class="menu-section">';
    html += `<div class="menu-section-title">${cat.emoji || ""} ${escapeHtml(cat.nome_pt)}</div>`;
    catItems.forEach(item => { html += renderItemRow(item); });
    html += '</div>';
  });

  // Items without category
  if (noCat.length > 0) {
    noCat.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    html += '<div class="menu-section">';
    html += '<div class="menu-section-title">Outros</div>';
    noCat.forEach(item => { html += renderItemRow(item); });
    html += '</div>';
  }

  if (items.length === 0) {
    html = '<p style="text-align:center;color:#888;padding:2rem;">Nenhum item no catalogo.</p>';
  }

  $menuContainer.innerHTML = html;

  // Bind checkboxes
  $menuContainer.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      state[cb.dataset.id].checked = cb.checked;
      markDirty();
      renderMenu();
    });
  });

  // Bind edit price buttons
  $menuContainer.querySelectorAll(".btn-edit-preco").forEach(btn => {
    btn.addEventListener("click", () => openPrecoModal(btn.dataset.id));
  });

  // Bind edit item buttons
  $menuContainer.querySelectorAll(".btn-edit-item").forEach(btn => {
    btn.addEventListener("click", () => openItemModal(btn.dataset.id));
  });
}

function renderItemRow(item) {
  const cls = item.checked ? "" : " inactive";
  const precoChanged = item.preco_atual !== item.preco_padrao;
  const precoClass = precoChanged ? " preco-changed" : "";
  return `
    <div class="menu-item-row${cls}">
      <input type="checkbox" data-id="${item.id}" ${item.checked ? "checked" : ""}>
      <span class="item-nome">${escapeHtml(item.nome)}${item.popular ? ' <small class="badge-pop">Popular</small>' : ''}</span>
      <span class="item-preco${precoClass}">&yen;${item.preco_atual.toLocaleString()}</span>
      <button type="button" class="btn-edit-preco" data-id="${item.id}" title="Alterar o preco deste item">Preco</button>
      <button type="button" class="btn-edit-item" data-id="${item.id}" title="Editar nome, foto, descricao e alergenicos">Editar</button>
    </div>`;
}

// -- Price Modal --
function openPrecoModal(itemId) {
  editingItemId = itemId;
  const item = state[itemId];
  $modalPrecoNome.textContent = item.nome;
  $inputPreco.value = item.preco_atual;
  $modalPreco.classList.remove("hidden");
  $inputPreco.focus();
  $inputPreco.select();
}

function closePrecoModal() {
  $modalPreco.classList.add("hidden");
  editingItemId = null;
}

function savePreco() {
  const val = parseInt($inputPreco.value, 10);
  if (!val || val <= 0) {
    alert("Digite um preco valido.");
    return;
  }
  state[editingItemId].preco_atual = val;
  closePrecoModal();
  markDirty();
  renderMenu();
}

// -- Item Editor Modal --
function openItemModal(itemId) {
  editingCatalogItemId = itemId || null;
  const isNew = !itemId;
  document.getElementById("modal-item-titulo").textContent = isNew ? "Novo Item" : "Editar Item";

  if (isNew) {
    document.getElementById("item-nome").value = "";
    document.getElementById("item-nome-ja").value = "";
    document.getElementById("item-desc-pt").value = "";
    document.getElementById("item-desc-ja").value = "";
    document.getElementById("item-preco").value = "";
    document.getElementById("item-foto").value = "";
    document.getElementById("item-categoria").value = "";
    document.getElementById("item-alergenicos-pt").value = "";
    document.getElementById("item-alergenicos-ja").value = "";
    document.getElementById("item-popular").checked = false;
  } else {
    const item = state[itemId];
    document.getElementById("item-nome").value = item.nome || "";
    document.getElementById("item-nome-ja").value = item.nome_ja || "";
    document.getElementById("item-desc-pt").value = item.desc_pt || "";
    document.getElementById("item-desc-ja").value = item.desc_ja || "";
    document.getElementById("item-preco").value = item.preco_padrao || "";
    document.getElementById("item-foto").value = item.foto_url || "";
    document.getElementById("item-categoria").value = item.categoria_id || "";
    document.getElementById("item-alergenicos-pt").value = (item.alergenicos_texto_pt || []).join(", ");
    document.getElementById("item-alergenicos-ja").value = (item.alergenicos_texto_ja || []).join(", ");
    document.getElementById("item-popular").checked = item.popular || false;
  }

  $modalItem.classList.remove("hidden");
  document.getElementById("item-nome").focus();
}

function closeItemModal() {
  $modalItem.classList.add("hidden");
  editingCatalogItemId = null;
}

async function saveItem() {
  const nome = document.getElementById("item-nome").value.trim();
  if (!nome) { alert("Nome e obrigatorio."); return; }
  const preco = parseInt(document.getElementById("item-preco").value, 10);
  if (!preco || preco <= 0) { alert("Preco e obrigatorio e deve ser maior que zero."); return; }

  const itemData = {
    nome,
    nome_ja: document.getElementById("item-nome-ja").value.trim() || null,
    desc_pt: document.getElementById("item-desc-pt").value.trim() || null,
    desc_ja: document.getElementById("item-desc-ja").value.trim() || null,
    preco_padrao: preco,
    foto_url: document.getElementById("item-foto").value.trim() || null,
    categoria_id: document.getElementById("item-categoria").value || null,
    alergenicos_texto_pt: parseCommaList(document.getElementById("item-alergenicos-pt").value),
    alergenicos_texto_ja: parseCommaList(document.getElementById("item-alergenicos-ja").value),
    popular: document.getElementById("item-popular").checked,
    ativo_no_catalogo: true
  };

  const sb = getSupabase();

  if (editingCatalogItemId) {
    // Update existing
    const { error } = await sb.from("menu_items").update(itemData).eq("id", editingCatalogItemId);
    if (error) { showMsg("Erro: " + error.message, "error"); return; }
    // Update local state
    Object.assign(state[editingCatalogItemId], itemData);
    state[editingCatalogItemId].preco_atual = preco;
    showMsg("Item atualizado!", "success");
  } else {
    // Create new
    const { data: newItem, error } = await sb.from("menu_items").insert(itemData).select().single();
    if (error) { showMsg("Erro: " + error.message, "error"); return; }
    // Add to local state
    state[newItem.id] = {
      ...itemData,
      checked: false,
      preco_atual: preco
    };
    showMsg("Item criado!", "success");
  }

  closeItemModal();
  markDirty();
  renderMenu();
}

function parseCommaList(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

// -- Save --
async function salvar() {
  const sb = getSupabase();

  if (templateId) {
    // Save to template
    await sb.from("event_template_items").delete().eq("template_id", templateId);

    const rows = Object.entries(state)
      .filter(([, s]) => s.ativo_no_catalogo)
      .map(([itemId, s]) => ({
        template_id: templateId,
        item_id: itemId,
        preco_override: s.preco_atual !== s.preco_padrao ? s.preco_atual : null,
        ativo: s.checked,
        ordem: s.ordem
      }));

    if (rows.length > 0) {
      const { error } = await sb.from("event_template_items").insert(rows);
      if (error) {
        showMsg("Erro ao salvar: " + error.message, "error");
        return;
      }
    }
    showMsg("Template salvo!", "success");
  } else {
    // Save to active_menu
    await sb.from("active_menu").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const rows = Object.entries(state)
      .filter(([, s]) => s.checked && s.ativo_no_catalogo)
      .map(([itemId, s]) => ({
        item_id: itemId,
        preco_atual: s.preco_atual,
        ativo: true,
        data_ativacao: new Date().toISOString()
      }));

    if (rows.length > 0) {
      const { error } = await sb.from("active_menu").insert(rows);
      if (error) {
        showMsg("Erro ao salvar: " + error.message, "error");
        return;
      }
    }
    showMsg("Menu salvo! " + rows.length + " items ativos.", "success");
  }
  markClean();
}

// -- Usar Este (activate template to active_menu) --
async function usarEste() {
  if (!confirm("Ativar este template como menu do cliente? O menu atual sera substituido.")) return;

  // Save template first
  await salvar();

  const sb = getSupabase();

  // Get template name
  const { data: tmpl } = await sb.from("event_templates").select("nome, usado_count").eq("id", templateId).single();
  const templateNome = tmpl?.nome || "";

  // Clear active_menu
  await sb.from("active_menu").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Insert active items from current state
  const rows = Object.entries(state)
    .filter(([, s]) => s.checked && s.ativo_no_catalogo)
    .map(([itemId, s]) => ({
      item_id: itemId,
      preco_atual: s.preco_atual,
      ativo: true,
      template_origem: templateNome,
      data_ativacao: new Date().toISOString()
    }));

  if (rows.length > 0) {
    const { error } = await sb.from("active_menu").insert(rows);
    if (error) {
      showMsg("Erro ao ativar: " + error.message, "error");
      return;
    }
  }

  // Update usage count
  await sb.from("event_templates").update({
    usado_count: (tmpl?.usado_count || 0) + 1,
    ultima_uso: new Date().toISOString()
  }).eq("id", templateId);

  showMsg("Template ativado! " + rows.length + " items no menu.", "success");
}

// -- Rename template --
async function renomearTemplate() {
  const novoNome = prompt("Novo nome do template:", $pageTitle.textContent);
  if (!novoNome || !novoNome.trim()) return;
  const sb = getSupabase();
  const { error } = await sb.from("event_templates").update({ nome: novoNome.trim() }).eq("id", templateId);
  if (error) {
    showMsg("Erro: " + error.message, "error");
    return;
  }
  $pageTitle.textContent = novoNome.trim();
  document.title = novoNome.trim() + " - Admin";
  showMsg("Nome atualizado!", "success");
}

// -- Mass actions --
document.getElementById("btn-marcar-todos").addEventListener("click", () => {
  Object.values(state).forEach(s => { if (s.ativo_no_catalogo) s.checked = true; });
  markDirty();
  renderMenu();
});

document.getElementById("btn-desmarcar-todos").addEventListener("click", () => {
  Object.values(state).forEach(s => { s.checked = false; });
  markDirty();
  renderMenu();
});

document.getElementById("btn-restaurar-precos").addEventListener("click", () => {
  Object.values(state).forEach(s => { s.preco_atual = s.preco_padrao; });
  markDirty();
  renderMenu();
  showMsg("Precos restaurados ao padrao.", "success");
});

// Buttons
$btnLogout.addEventListener("click", logout);
$btnSalvar.addEventListener("click", salvar);
$btnUsarEste.addEventListener("click", usarEste);
document.getElementById("btn-renomear").addEventListener("click", renomearTemplate);
document.getElementById("btn-add-item").addEventListener("click", () => openItemModal(null));
document.getElementById("btn-preco-cancel").addEventListener("click", closePrecoModal);
document.getElementById("btn-preco-save").addEventListener("click", savePreco);
document.getElementById("btn-item-cancel").addEventListener("click", closeItemModal);
document.getElementById("btn-item-save").addEventListener("click", saveItem);

// Close modals on overlay click
$modalPreco.addEventListener("click", (e) => { if (e.target === $modalPreco) closePrecoModal(); });
$modalItem.addEventListener("click", (e) => { if (e.target === $modalItem) closeItemModal(); });

// Init
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await loadMenu();
})();
