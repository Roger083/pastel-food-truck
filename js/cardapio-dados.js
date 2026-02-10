/**
 * Mapeamento de nomes/slugs para imagem, descrição e ingredientes dos pastéis.
 * Usado em cardapio-completo-verde (lista), cardapio-item (detalhe) e liff-galeria.
 */
window.PASTEIS_INFO = {
  carne: {
    img: "img/pastel-carne.png",
    emoji: "🥩",
    desc_pt: "Carne moída temperada",
    desc_ja: "スパイスで味付けした牛ひき肉",
    nome_ja: "牛肉パステル",
    ingredientes_pt: ["Carne moída", "Cebola", "Temperos"],
    ingredientes_ja: ["牛ひき肉", "玉ねぎ", "スパイス"],
    alergenicos_pt: ["Glúten"],
    alergenicos_ja: ["小麦"],
  },
  "carne-queijo": {
    img: "img/pastel-carne-queijo.png",
    emoji: "🧀🥩",
    desc_pt: "Carne moída com muito queijo",
    desc_ja: "牛肉とたっぷりチーズ",
    nome_ja: "牛肉＆チーズパステル",
    ingredientes_pt: ["Carne moída", "Queijo", "Temperos"],
    ingredientes_ja: ["牛ひき肉", "チーズ", "スパイス"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  misto: {
    img: "img/pastel-carne-queijo.png",
    emoji: "🧀🥩",
    desc_pt: "Carne moída com muito queijo",
    desc_ja: "牛肉とたっぷりチーズ",
    nome_ja: "ミックスパステル",
    ingredientes_pt: ["Carne moída", "Queijo", "Temperos"],
    ingredientes_ja: ["牛ひき肉", "チーズ", "スパイス"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  pizza: {
    img: "img/pastel-pizza.png",
    emoji: "🍕",
    desc_pt: "Tomate, queijo e orégano",
    desc_ja: "トマト、チーズ、オレガノ",
    nome_ja: "ピザパステル",
    ingredientes_pt: ["Tomate", "Queijo", "Orégano"],
    ingredientes_ja: ["トマト", "チーズ", "オレガノ"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  queijo: {
    img: "img/pastel-queijo.png",
    emoji: "🧀",
    desc_pt: "Muito queijo derretido",
    desc_ja: "たっぷりチーズ",
    nome_ja: "チーズパステル",
    ingredientes_pt: ["Queijo"],
    ingredientes_ja: ["チーズ"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  frango: {
    img: "img/pastel-frango.png",
    emoji: "🐔",
    desc_pt: "Frango com molho de tomate",
    desc_ja: "チキンとトマトソース",
    nome_ja: "チキンパステル",
    ingredientes_pt: ["Frango", "Molho de tomate"],
    ingredientes_ja: ["チキン", "トマトソース"],
    alergenicos_pt: ["Glúten"],
    alergenicos_ja: ["小麦"],
  },
  chocolate: {
    img: "img/pastel-carne.png",
    emoji: "🍫",
    desc_pt: "Recheio cremoso de chocolate",
    desc_ja: "クリーミーなチョコレート",
    nome_ja: "チョコパステル",
    ingredientes_pt: ["Chocolate", "Leite condensado"],
    ingredientes_ja: ["チョコレート", "練乳"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  romeu: {
    img: "img/pastel-queijo.png",
    emoji: "🧀🍇",
    desc_pt: "Queijo com goiabada",
    desc_ja: "チーズとグアバペースト",
    nome_ja: "ロメオとジュリエットパステル",
    ingredientes_pt: ["Queijo", "Goiabada"],
    ingredientes_ja: ["チーズ", "グアバペースト"],
    alergenicos_pt: ["Glúten", "Leite"],
    alergenicos_ja: ["小麦", "乳"],
  },
  bebida: {
    img: "img/pastel-carne.png",
    emoji: "🥤",
    desc_pt: "Bebida refrescante",
    desc_ja: "さわやかなドリンク",
    nome_ja: "ドリンク",
    ingredientes_pt: [],
    ingredientes_ja: [],
    alergenicos_pt: [],
    alergenicos_ja: [],
  },
  yakitori: {
    img: "img/pastel-carne.png",
    emoji: "🍢",
    desc_pt: "Espetinho japonês grelhado",
    desc_ja: "炭火焼き鳥",
    nome_ja: "焼き鳥",
    ingredientes_pt: ["Frango", "Molho tare", "Cebolinha"],
    ingredientes_ja: ["鶏肉", "タレ", "ねぎ"],
    alergenicos_pt: ["Soja"],
    alergenicos_ja: ["大豆"],
  },
  churrasco: {
    img: "img/pastel-carne.png",
    emoji: "🥩",
    desc_pt: "Churrasco misto brasileiro",
    desc_ja: "ブラジル風ミックスBBQ",
    nome_ja: "シュハスコミックス",
    ingredientes_pt: ["Picanha", "Linguiça", "Frango"],
    ingredientes_ja: ["ピッカーニャ", "ソーセージ", "チキン"],
    alergenicos_pt: [],
    alergenicos_ja: [],
  },
  hotdog: {
    img: "img/pastel-carne.png",
    emoji: "🌭",
    desc_pt: "Hot dog com linguiça artesanal",
    desc_ja: "手作りソーセージのホットドッグ",
    nome_ja: "ホットドッグ",
    ingredientes_pt: ["Linguiça artesanal", "Pão", "Molhos"],
    ingredientes_ja: ["手作りソーセージ", "パン", "ソース"],
    alergenicos_pt: ["Glúten"],
    alergenicos_ja: ["小麦"],
  },
};

/** Retorna slug a partir do nome do item (ex: "Pastel de carne" -> "carne"). */
function slugFromNome(nome) {
  if (!nome) return "carne";
  const n = nome.toLowerCase();
  // Pastéis salgados
  if (n.includes("misto") || (n.includes("carne") && n.includes("queijo"))) return "misto";
  if (n.includes("carne")) return "carne";
  if (n.includes("queijo") && !n.includes("romeu")) return "queijo";
  if (n.includes("pizza")) return "pizza";
  if (n.includes("frango") && !n.includes("yakitori")) return "frango";
  // Pastéis doces
  if (n.includes("chocolate")) return "chocolate";
  if (n.includes("romeu") || n.includes("julieta") || n.includes("goiaba")) return "romeu";
  // Bebidas
  if (n.includes("coca") || n.includes("guaraná") || n.includes("água") || n.includes("chopp") || n.includes("suco") || n.includes("refrigerante")) return "bebida";
  // Pratos especiais
  if (n.includes("yakitori") || n.includes("espeto japonês")) return "yakitori";
  if (n.includes("churrasco")) return "churrasco";
  if (n.includes("hot dog") || n.includes("linguiça")) return "hotdog";
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

/**
 * Textos de i18n para uso no cardápio
 */
window.CARDAPIO_I18N = {
  pt: {
    verCarrinho: "Ver carrinho",
    popular: "Popular",
    adicionado: "Adicionado!",
    outros: "Outros"
  },
  ja: {
    verCarrinho: "カートを見る",
    popular: "人気",
    adicionado: "追加しました！",
    outros: "その他"
  }
};
