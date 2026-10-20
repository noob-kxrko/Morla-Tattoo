/* Conexión con Supabase (Project Settings → API).
   La "anon key" es pública por diseño: la seguridad real está en supabase.sql (RLS). */
const SUPABASE_URL      = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_PUBLIC_KEY';

window.sb = (window.supabase && !SUPABASE_URL.includes('TU-PROYECTO'))
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
