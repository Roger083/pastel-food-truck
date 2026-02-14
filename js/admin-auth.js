import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CONFIG = window.FOOD_TRUCK_CONFIG;
let _supabase = null;

export function getSupabase() {
  if (!_supabase && CONFIG?.supabaseUrl && CONFIG?.supabaseAnonKey) {
    _supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }
  return _supabase;
}

export async function requireAuth() {
  const sb = getSupabase();
  if (!sb) {
    window.location.href = "admin.html";
    return null;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "admin.html";
    return null;
  }
  return session;
}

export async function logout() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  window.location.href = "admin.html";
}
