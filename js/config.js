/**
 * Configuração do Food Truck
 * Preencha os 3 valores abaixo. Guia completo: CONFIGURACAO_PASSO_A_PASSO.md
 *
 * 1) supabaseUrl  → Supabase → Settings → API → "Project URL"
 * 2) supabaseAnonKey → Supabase → Settings → API → "anon" "public" (Reveal e copie)
 * 3) liffId       → LINE Developers → seu Channel → LIFF → "LIFF ID"
 */
// Atenção: é "qee" no meio, NÃO "gee" → ejzaaoyqeeqyuoiozfxn
// foodTruckName: nome que aparece no app (ex.: no cabeçalho do LIFF). Veja NOTIFICACAO_LINE.md para o nome no LINE Developers.
// adminSecret (opcional): mesmo valor do secret ADMIN_SECRET no Supabase (Edge Functions → Secrets). Evita 401 ao clicar em "Marcar pronto".
window.FOOD_TRUCK_CONFIG = {
  foodTruckName: 'Pastel Food Truck',
  liffId: '2009073867-mQNTAnqH',
  supabaseUrl: 'https://ejzaaoyqeeqyuoiozfxn.supabase.co',
  supabaseAnonKey: 'sb_publishable_r18ogAShfeiOmhF4SOHupg_Hyw-tHGR',
  adminSecret: ''  // JoseHiga
};
