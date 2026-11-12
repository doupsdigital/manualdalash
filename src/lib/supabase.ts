import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Sem as variáveis de ambiente, o app roda em modo local: sem login, progresso só no navegador. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
