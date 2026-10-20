/* Conexión con Supabase (Project Settings → API).
   La "anon key" es pública por diseño: la seguridad real está en supabase.sql (RLS). */
const SUPABASE_URL      = 'https://elxucmxfoqkovginajih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHVjbXhmb3Frb3ZnaW5hamloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTcxMDQsImV4cCI6MjEwODA3MzEwNH0.Ph_1wovpQJoW9k1yG0CkKvI7eSSoYlzPFXX-HfwWHlc';

window.sb = (window.supabase && !SUPABASE_URL.includes('TU-PROYECTO'))
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
