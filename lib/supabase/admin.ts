import { createClient } from "@supabase/supabase-js";

// Cliente com a chave secreta do Supabase. Use SOMENTE no servidor (rotas e webhooks).
export function createAdmin() {
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!chave) throw new Error("SUPABASE_SECRET_KEY não configurada");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
