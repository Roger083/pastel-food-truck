import { getSupabase, requireAuth, logout } from "./admin-auth.js";

const $loading = document.getElementById("loading");
const $feedback = document.getElementById("feedback");
const $menuContainer = document.getElementById("menu-container");
const $pageTitle = document.getElementById("page-title");
const $modalPreco = document.getElementById("modal-preco");
const $modalTemplate = document.getElementById("modal-template");
const $inputPreco = document.getElementById("input-preco");
const $modalPrecoNome = document.getElementById("modal-preco-nome");

const params = new URLSearchParams(window.location.search);
const templateId = params.get("template");

// Local state: { itemId: { nome, preco_padrao, categoria_id, ordem, popular, checked, preco_atual } }
let state = {};
let editingItemId = null;

function showMsg(msg, type) {
  $feedback.textContent = msg;
  $feedback.className = "admin-feedback " + (type || "success");
  $feedback.hidden = false;
  setTimeout(() => { $feedback.hidden = true; }, 5000);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function loadMenu() {
  const sb = getSupabase();
  $loading.hidden = false;

  // Load all catalog items
  const { data: items, error: errItems } = await sb
    .from("menu_items")
    .select("id, nome, preco_padrao, categoria_id, ordem, popular, ativo_no_catalogo")
    .eq("ativo_no_catalogo", true)
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

  // Initialize state from catalog
  state = {};
  (items || []).forEach(item => {
    state[item.id] = {
      nome: item.nome,
      preco_padrao: item.preco_padrao,
      categoria_id: item.categoria_id,
      ordem: item.ordem,
      popular: item.popular,
      checked: false,
      preco_atual: item.preco_padrao
    };
  });

  if (templateId) {
    // Editing a template: load template items
    $pageTitle.textContent = "Editar Template";
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
  renderMenu(cats || []);
}

function renderMenu(cats) {
  const items = Object.entries(state).map(([id, s]) => ({ id, ...s }));

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

  // Active items section
  const activeItems = items.filter(i => i.checked);
  const inactiveItems = items.filter(i => !i.checked);

  html += '<div class="menu-section">';
  html += '<div class="menu-section-title">Ativos no Menu (' + activeItems.length + ')</div>';
  if (activeItems.length === 0) {
    html += '<p style="color:#666;padding:0.5rem;">Nenhum item ativo</p>';
  }
  activeItems.sort((a, b) => a.ordem - b.ordem).forEach(item => {
    html += renderItemRow(item);
  });
  html += '</div>';

  html += '<div class="menu-section">';
  html += '<div class="menu-section-title">Disponiveis (' + inactiveItems.length + ')</div>';
  if (inactiveItems.length === 0) {
    html += '<p style="color:#666;padding:0.5rem;">Todos os items estao ativos</p>';
  }
  inactiveItems.sort((a, b) => a.ordem - b.ordem).forEach(item => {
    html += renderItemRow(item);
  });
  html += '</div>';

  $menuContainer.innerHTML = html;

  // Bind checkboxes
  $menuContainer.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      state[cb.dataset.id].checked = cb.checked;
      renderMenu(cats);
    });
  });

  // Bind edit price buttons
  $menuContainer.querySelectorAll(".btn-edit-preco").forEach(btn => {
    btn.addEventListener("click", () => openPrecoModal(btn.dataset.id));
  });
}

function renderItemRow(item) {
  const cls = item.checked ? "" : " inactive";
  return `
    <div class="menu-item-row${cls}">
      <input type="checkbox" data-id="${item.id}" ${item.checked ? "checked" : ""}>
      <span class="item-nome">${escapeHtml(item.nome)}${item.popular ? ' <small style="color:#fde047;">Popular</small>' : ''}</span>
      <span class="item-preco">&yen;${item.preco_atual.toLocaleString()}</span>
      <button type="button" class="btn-edit-preco" data-id="${item.id}">Preco</button>
    </div>`;
}

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
  // Re-render
  loadCatsAndRender();
}

async function loadCatsAndRender() {
  const sb = getSupabase();
  const { data: cats } = await sb
    .from("categorias")
    .select("id, nome_pt, emoji, ordem")
    .order("ordem", { ascending: true });
  renderMenu(cats || []);
}

async function salvar() {
  const sb = getSupabase();

  if (templateId) {
    // Save to template
    await sb.from("event_template_items").delete().eq("template_id", templateId);

    const rows = Object.entries(state).map(([itemId, s]) => ({
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
    showMsg("Template salvo com sucesso!", "success");
  } else {
    // Save to active_menu
    // Delete all existing
    await sb.from("active_menu").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert checked items
    const rows = Object.entries(state)
      .filter(([, s]) => s.checked)
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
    showMsg("Menu ativo salvo! " + rows.length + " items ativos.", "success");
  }
}

function openTemplateModal() {
  $modalTemplate.classList.remove("hidden");
  document.getElementById("input-template-nome").value = "";
  document.getElementById("input-template-desc").value = "";
  document.getElementById("input-template-nome").focus();
}

function closeTemplateModal() {
  $modalTemplate.classList.add("hidden");
}

async function salvarComoTemplate() {
  const nome = document.getElementById("input-template-nome").value.trim();
  if (!nome) {
    alert("Digite um nome para o template.");
    return;
  }
  const desc = document.getElementById("input-template-desc").value.trim();
  const sb = getSupabase();

  const { data: newTmpl, error: errT } = await sb
    .from("event_templates")
    .insert({ nome, descricao: desc || null })
    .select()
    .single();

  if (errT) {
    showMsg("Erro: " + errT.message, "error");
    return;
  }

  // Insert items
  const rows = Object.entries(state).map(([itemId, s]) => ({
    template_id: newTmpl.id,
    item_id: itemId,
    preco_override: s.preco_atual !== s.preco_padrao ? s.preco_atual : null,
    ativo: s.checked,
    ordem: s.ordem
  }));

  if (rows.length > 0) {
    await sb.from("event_template_items").insert(rows);
  }

  closeTemplateModal();
  showMsg("Template '" + nome + "' criado com sucesso!", "success");
}

// Mass actions
document.getElementById("btn-marcar-todos").addEventListener("click", () => {
  Object.values(state).forEach(s => { s.checked = true; });
  loadCatsAndRender();
});

document.getElementById("btn-desmarcar-todos").addEventListener("click", () => {
  Object.values(state).forEach(s => { s.checked = false; });
  loadCatsAndRender();
});

document.getElementById("btn-restaurar-precos").addEventListener("click", () => {
  Object.values(state).forEach(s => { s.preco_atual = s.preco_padrao; });
  loadCatsAndRender();
  showMsg("Precos restaurados ao padrao.", "success");
});

// Buttons
document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("btn-salvar").addEventListener("click", salvar);
document.getElementById("btn-salvar-template").addEventListener("click", openTemplateModal);
document.getElementById("btn-preco-cancel").addEventListener("click", closePrecoModal);
document.getElementById("btn-preco-save").addEventListener("click", savePreco);
document.getElementById("btn-tmpl-cancel").addEventListener("click", closeTemplateModal);
document.getElementById("btn-tmpl-save").addEventListener("click", salvarComoTemplate);

// Close modals on overlay click
$modalPreco.addEventListener("click", (e) => { if (e.target === $modalPreco) closePrecoModal(); });
$modalTemplate.addEventListener("click", (e) => { if (e.target === $modalTemplate) closeTemplateModal(); });

// Init
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await loadMenu();
})();
