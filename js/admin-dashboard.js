import { getSupabase, requireAuth, logout } from "./admin-auth.js";

const $loading = document.getElementById("loading");
const $templateList = document.getElementById("template-list");
const $feedback = document.getElementById("feedback");
const $modalCriar = document.getElementById("modal-criar");
const $modalTitulo = document.getElementById("modal-titulo");
const $inputNome = document.getElementById("input-nome");
const $inputDesc = document.getElementById("input-desc");

let editingTemplateId = null;

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

async function loadTemplates() {
  const sb = getSupabase();
  $loading.hidden = false;

  const { data: templates, error } = await sb
    .from("event_templates")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    $loading.textContent = "Falha ao carregar templates.";
    return;
  }

  // Get item counts per template
  const { data: itemCounts } = await sb
    .from("event_template_items")
    .select("template_id, item_id");

  const countMap = {};
  if (itemCounts) {
    itemCounts.forEach(r => {
      countMap[r.template_id] = (countMap[r.template_id] || 0) + 1;
    });
  }

  $loading.hidden = true;

  if (!templates || templates.length === 0) {
    $templateList.innerHTML = '<div class="template-empty">Nenhum template criado ainda.</div>';
    return;
  }

  $templateList.innerHTML = templates.map(t => {
    const qtd = countMap[t.id] || 0;
    const ultimaUso = t.ultima_uso
      ? new Date(t.ultima_uso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
      : "Nunca";
    return `
      <div class="template-card" data-id="${t.id}">
        <div class="template-nome">${escapeHtml(t.nome)}</div>
        <div class="template-desc">${t.descricao ? escapeHtml(t.descricao) : ""}</div>
        <div class="template-meta">${qtd} items &middot; Usado ${t.usado_count || 0}x &middot; Ultimo: ${ultimaUso}</div>
        <div class="template-actions">
          <button type="button" class="btn-primary btn-sm btn-usar" data-id="${t.id}">Usar Este</button>
          <button type="button" class="btn-secondary btn-sm btn-editar" data-id="${t.id}">Editar</button>
          <button type="button" class="btn-secondary btn-sm btn-duplicar" data-id="${t.id}">Duplicar</button>
          <button type="button" class="btn-danger btn-sm btn-deletar" data-id="${t.id}">Deletar</button>
        </div>
      </div>`;
  }).join("");

  // Bind buttons
  $templateList.querySelectorAll(".btn-usar").forEach(btn => {
    btn.addEventListener("click", () => usarTemplate(btn.dataset.id));
  });
  $templateList.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => editarTemplate(btn.dataset.id));
  });
  $templateList.querySelectorAll(".btn-duplicar").forEach(btn => {
    btn.addEventListener("click", () => duplicarTemplate(btn.dataset.id));
  });
  $templateList.querySelectorAll(".btn-deletar").forEach(btn => {
    btn.addEventListener("click", () => deletarTemplate(btn.dataset.id));
  });
}

async function usarTemplate(id) {
  if (!confirm("Ativar este template? O menu ativo atual sera substituido.")) return;

  const sb = getSupabase();

  // Get template items
  const { data: tItems, error: errItems } = await sb
    .from("event_template_items")
    .select("item_id, preco_override, ativo, ordem, menu_items(preco_padrao)")
    .eq("template_id", id);

  if (errItems || !tItems) {
    showMsg("Erro ao carregar items do template.", "error");
    return;
  }

  // Get template name
  const { data: tmpl } = await sb
    .from("event_templates")
    .select("nome")
    .eq("id", id)
    .single();

  const templateNome = tmpl?.nome || "";

  // Clear active_menu
  await sb.from("active_menu").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Insert items from template
  const rows = tItems
    .filter(ti => ti.ativo)
    .map(ti => ({
      item_id: ti.item_id,
      preco_atual: ti.preco_override || ti.menu_items?.preco_padrao || 0,
      ativo: true,
      template_origem: templateNome,
      data_ativacao: new Date().toISOString()
    }));

  if (rows.length > 0) {
    const { error: errInsert } = await sb.from("active_menu").insert(rows);
    if (errInsert) {
      showMsg("Erro ao ativar template: " + errInsert.message, "error");
      return;
    }
  }

  // Update usage count
  await sb.from("event_templates").update({
    usado_count: (tmpl?.usado_count || 0) + 1,
    ultima_uso: new Date().toISOString()
  }).eq("id", id);

  // Redirect to menu ativo
  window.location.href = "admin-menu-ativo.html";
}

function editarTemplate(id) {
  // Redirect to menu ativo page in template edit mode
  window.location.href = "admin-menu-ativo.html?template=" + id;
}

async function duplicarTemplate(id) {
  const sb = getSupabase();

  const { data: original } = await sb
    .from("event_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) {
    showMsg("Template nao encontrado.", "error");
    return;
  }

  const { data: newTmpl, error: errNew } = await sb
    .from("event_templates")
    .insert({
      nome: original.nome + " (Copia)",
      descricao: original.descricao,
      usado_count: 0
    })
    .select()
    .single();

  if (errNew) {
    showMsg("Erro ao duplicar: " + errNew.message, "error");
    return;
  }

  // Copy items
  const { data: items } = await sb
    .from("event_template_items")
    .select("item_id, preco_override, ativo, ordem")
    .eq("template_id", id);

  if (items && items.length > 0) {
    const newItems = items.map(i => ({
      template_id: newTmpl.id,
      item_id: i.item_id,
      preco_override: i.preco_override,
      ativo: i.ativo,
      ordem: i.ordem
    }));
    await sb.from("event_template_items").insert(newItems);
  }

  showMsg("Template duplicado com sucesso!", "success");
  loadTemplates();
}

async function deletarTemplate(id) {
  if (!confirm("Deletar este template? Esta acao nao pode ser desfeita.")) return;

  const sb = getSupabase();
  const { error } = await sb.from("event_templates").delete().eq("id", id);

  if (error) {
    showMsg("Erro ao deletar: " + error.message, "error");
    return;
  }

  showMsg("Template deletado.", "success");
  loadTemplates();
}

function openModal(title, nome, desc, templateId) {
  editingTemplateId = templateId || null;
  $modalTitulo.textContent = title;
  $inputNome.value = nome || "";
  $inputDesc.value = desc || "";
  $modalCriar.classList.remove("hidden");
  $inputNome.focus();
}

function closeModal() {
  $modalCriar.classList.add("hidden");
  editingTemplateId = null;
}

async function saveModal() {
  const nome = $inputNome.value.trim();
  if (!nome) {
    alert("Digite um nome para o template.");
    return;
  }
  const desc = $inputDesc.value.trim();
  const sb = getSupabase();

  if (editingTemplateId) {
    // Update existing
    const { error } = await sb.from("event_templates")
      .update({ nome, descricao: desc || null })
      .eq("id", editingTemplateId);
    if (error) {
      showMsg("Erro: " + error.message, "error");
      return;
    }
    showMsg("Template atualizado!", "success");
  } else {
    // Create new
    const { data: newTmpl, error } = await sb.from("event_templates")
      .insert({ nome, descricao: desc || null })
      .select()
      .single();
    if (error) {
      showMsg("Erro: " + error.message, "error");
      return;
    }
    showMsg("Template criado!", "success");
    // Redirect to edit items
    closeModal();
    window.location.href = "admin-menu-ativo.html?template=" + newTmpl.id;
    return;
  }

  closeModal();
  loadTemplates();
}

// Event listeners
document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("btn-criar").addEventListener("click", () => openModal("Criar Template", "", "", null));
document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
document.getElementById("btn-modal-save").addEventListener("click", saveModal);

$modalCriar.addEventListener("click", (e) => {
  if (e.target === $modalCriar) closeModal();
});

// Init
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  loadTemplates();
})();
