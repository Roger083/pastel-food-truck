/**
 * Mapeamento de nomes/slugs para imagem, descrição e ingredientes dos pastéis.
 * Usado em cardapio-completo-verde (lista), cardapio-item (detalhe) e liff-galeria.
 */
window.PASTEIS_INFO = {
  carne: {
    img: "img/pastel-carne.png",
    desc_pt: "Carne moída temperada",
    desc_ja: "スパイスで味付けした牛ひき肉",
    ingredientes_pt: ["Carne moída", "Cebola", "Temperos"],
    ingredientes_ja: ["牛ひき肉", "玉ねぎ", "スパイス"],
  },
  "carne-queijo": {
    img: "img/pastel-carne-queijo.png",
    desc_pt: "Carne moída com muito queijo",
    desc_ja: "牛肉とたっぷりチーズ",
    ingredientes_pt: ["Carne moída", "Queijo", "Temperos"],
    ingredientes_ja: ["牛ひき肉", "チーズ", "スパイス"],
  },
  pizza: {
    img: "img/pastel-pizza.png",
    desc_pt: "Tomate, queijo e orégano",
    desc_ja: "トマト、チーズ、オレガノ",
    ingredientes_pt: ["Tomate", "Queijo", "Orégano"],
    ingredientes_ja: ["トマト", "チーズ", "オレガノ"],
  },
  queijo: {
    img: "img/pastel-queijo.png",
    desc_pt: "Muito queijo derretido",
    desc_ja: "たっぷりチーズ",
    ingredientes_pt: ["Queijo"],
    ingredientes_ja: ["チーズ"],
  },
  frango: {
    img: "img/pastel-frango.png",
    desc_pt: "Frango com molho de tomate",
    desc_ja: "チキンとトマトソース",
    ingredientes_pt: ["Frango", "Molho de tomate"],
    ingredientes_ja: ["チキン", "トマトソース"],
  },
};

/** Retorna slug a partir do nome do item (ex: "Pastel de carne" -> "carne"). */
function slugFromNome(nome) {
  if (!nome) return "carne";
  const n = nome.toLowerCase();
  if (n.includes("misto") || (n.includes("carne") && n.includes("queijo"))) return "carne-queijo";
  if (n.includes("carne")) return "carne";
  if (n.includes("queijo")) return "queijo";
  if (n.includes("pizza")) return "pizza";
  if (n.includes("frango")) return "frango";
  return "carne";
}

/** Retorna path da imagem para um item (nome ou slug). */
function imgParaItem(nomeOuSlug) {
  const slug = nomeOuSlug && nomeOuSlug.includes("/") ? nomeOuSlug : slugFromNome(nomeOuSlug);
  const info = window.PASTEIS_INFO[slug] || window.PASTEIS_INFO.carne;
  return info.img;
}

window.slugFromNome = slugFromNome;
window.imgParaItem = imgParaItem;
