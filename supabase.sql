-- ============================================================
--  MORLA TATTOO · Sistema de citas · Script completo de Supabase
--  Pégalo entero en: Supabase → SQL Editor → New query → Run
--  Se puede ejecutar más de una vez sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1) ADMINISTRADORES (solo ellos ven las citas)
--    Esta tabla no tiene políticas: nadie del público puede leerla.
-- ------------------------------------------------------------
create table if not exists public.admins (
    email text primary key
);
alter table public.admins enable row level security;

-- ⚠️ CAMBIA ESTOS CORREOS por los reales (el de tu hermano y el tuyo).
-- Deben ser los mismos con los que crearás los usuarios en Authentication.
insert into public.admins (email) values
    ('correo_de_tu_hermano@gmail.com'),
    ('tu_correo@gmail.com')
on conflict do nothing;

create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
    select exists (
        select 1 from public.admins a
        where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

create or replace function public.soy_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select public.es_admin(); $$;

-- ------------------------------------------------------------
-- 2) CONFIGURACIÓN DE LA PROMO (editable desde Table Editor)
-- ------------------------------------------------------------
create table if not exists public.promo_config (
    id                     int primary key default 1 check (id = 1),
    activa                 boolean  not null default true,
    fechas                 date[]   not null default array['2026-10-29','2026-10-30','2026-10-31']::date[],
    horas                  smallint[] not null default array[8,9,10,11,12,13,14,16,17,18]::smallint[],
    horas_anticipacion     int      not null default 48,   -- las citas cierran X horas antes
    max_citas_por_telefono int      not null default 2     -- evita que una persona acapare horas
);
insert into public.promo_config default values on conflict do nothing;
alter table public.promo_config enable row level security;

drop policy if exists "admin gestiona config" on public.promo_config;
create policy "admin gestiona config" on public.promo_config
    for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ------------------------------------------------------------
-- 3) CITAS (privadas: el público NO puede leerlas ni escribirlas directo)
-- ------------------------------------------------------------
create table if not exists public.citas (
    id           uuid primary key default gen_random_uuid(),
    codigo       text not null unique,
    fecha        date not null,
    hora         smallint not null check (hora between 0 and 23),   -- hora de inicio (formato 24 h)
    nombre       text not null check (char_length(nombre)   between 2 and 80),
    telefono     text not null check (char_length(telefono) between 10 and 20),
    zona         text not null check (char_length(zona)     between 1 and 120),
    notas        text          check (char_length(notas) <= 500),
    disenos      text[] not null default '{}',                      -- rutas en el bucket "disenos"
    estado       text not null default 'pendiente'
                 check (estado in ('pendiente','aprobada','cambios','rechazada','completada','cancelada','bloqueada')),
    nota_interna text,                                              -- solo la ve el admin
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- Una sola cita por hora. Si se rechaza o cancela, la hora se libera sola.
create unique index if not exists citas_hora_unica
    on public.citas (fecha, hora)
    where estado not in ('rechazada','cancelada');
create index if not exists citas_fecha_idx on public.citas (fecha, hora);

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists citas_updated_at on public.citas;
create trigger citas_updated_at before update on public.citas
    for each row execute function public.tocar_updated_at();

alter table public.citas enable row level security;
revoke all on public.citas from anon;

drop policy if exists "admin ve citas"    on public.citas;
drop policy if exists "admin crea citas"  on public.citas;
drop policy if exists "admin edita citas" on public.citas;
drop policy if exists "admin borra citas" on public.citas;
create policy "admin ve citas"    on public.citas for select to authenticated using (public.es_admin());
create policy "admin crea citas"  on public.citas for insert to authenticated with check (public.es_admin());
create policy "admin edita citas" on public.citas for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin borra citas" on public.citas for delete to authenticated using (public.es_admin());

-- ------------------------------------------------------------
-- 4) FUNCIONES PÚBLICAS (lo único que la web puede hacer sin iniciar sesión)
-- ------------------------------------------------------------

-- 4a) Qué horas están ocupadas (sin mostrar datos de nadie)
create or replace function public.horas_ocupadas()
returns table (fecha date, hora smallint)
language sql stable security definer
set search_path = public
as $$
    select c.fecha, c.hora from public.citas c
    where c.estado not in ('rechazada','cancelada');
$$;

-- 4b) Días y horas de la promo
create or replace function public.config_promo()
returns json
language sql stable security definer
set search_path = public
as $$
    select json_build_object(
        'activa', activa, 'fechas', fechas, 'horas', horas,
        'horas_anticipacion', horas_anticipacion
    ) from public.promo_config where id = 1;
$$;

-- 4c) Crear una cita (valida todo en el servidor; la web no es de fiar)
create or replace function public.crear_cita(
    p_fecha    date,
    p_hora     smallint,
    p_nombre   text,
    p_telefono text,
    p_zona     text,
    p_notas    text default null,
    p_hp       text default ''          -- campo trampa anti-bots
)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
    cfg      public.promo_config;
    v_tel    text;
    v_id     uuid;
    v_codigo text;
    v_inicio timestamptz;
begin
    if coalesce(p_hp, '') <> '' then      -- bot: fingimos éxito sin guardar nada
        return json_build_object('id', gen_random_uuid(), 'codigo', 'MT-00000');
    end if;

    select * into cfg from public.promo_config where id = 1;
    if not cfg.activa then raise exception 'PROMO_CERRADA'; end if;
    if not (p_fecha = any(cfg.fechas)) or not (p_hora = any(cfg.horas)) then
        raise exception 'HORA_INVALIDA';
    end if;

    -- Hora de República Dominicana
    v_inicio := make_timestamptz(
        extract(year from p_fecha)::int, extract(month from p_fecha)::int,
        extract(day from p_fecha)::int, p_hora, 0, 0, 'America/Santo_Domingo');
    if v_inicio - now() < make_interval(hours => cfg.horas_anticipacion) then
        raise exception 'HORA_CERRADA';
    end if;

    v_tel := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
    if char_length(v_tel) < 10 or char_length(v_tel) > 20
       or char_length(trim(coalesce(p_nombre, ''))) < 2
       or char_length(trim(coalesce(p_zona, ''))) < 1 then
        raise exception 'DATOS_INVALIDOS';
    end if;

    if (select count(*) from public.citas
        where telefono = v_tel and estado in ('pendiente','aprobada','cambios')) >= cfg.max_citas_por_telefono then
        raise exception 'LIMITE_TELEFONO';
    end if;

    loop
        v_codigo := 'MT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
        exit when not exists (select 1 from public.citas where codigo = v_codigo);
    end loop;

    begin
        insert into public.citas (codigo, fecha, hora, nombre, telefono, zona, notas)
        values (v_codigo, p_fecha, p_hora, left(trim(p_nombre), 80), v_tel, left(trim(p_zona), 120),
                nullif(left(trim(coalesce(p_notas, '')), 500), ''))
        returning id into v_id;
    exception when unique_violation then
        raise exception 'HORA_OCUPADA';
    end;

    return json_build_object('id', v_id, 'codigo', v_codigo);
end $$;

-- 4d) ¿Se puede subir este archivo? Solo a una cita recién creada (15 min) y sin diseños aún
create or replace function public.puede_subir(p_name text)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
declare v_id uuid;
begin
    if p_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[12]\.jpg$' then
        return false;
    end if;
    v_id := split_part(p_name, '/', 1)::uuid;
    return exists (
        select 1 from public.citas c
        where c.id = v_id and c.estado = 'pendiente'
          and cardinality(c.disenos) = 0
          and c.created_at > now() - interval '15 minutes'
    );
end $$;

-- 4e) Enlazar los diseños ya subidos con la cita
create or replace function public.adjuntar_disenos(p_id uuid, p_paths text[])
returns void
language plpgsql security definer
set search_path = public, storage
as $$
begin
    if coalesce(cardinality(p_paths), 0) not between 1 and 2 then
        raise exception 'DATOS_INVALIDOS';
    end if;
    if exists (select 1 from unnest(p_paths) p where p !~ ('^' || p_id::text || '/[12]\.jpg$')) then
        raise exception 'DATOS_INVALIDOS';
    end if;
    if (select count(*) from storage.objects o
        where o.bucket_id = 'disenos' and o.name = any(p_paths)) <> cardinality(p_paths) then
        raise exception 'ARCHIVOS_NO_ENCONTRADOS';
    end if;
    update public.citas set disenos = p_paths
    where id = p_id and cardinality(disenos) = 0 and created_at > now() - interval '15 minutes';
    if not found then raise exception 'CITA_NO_VALIDA'; end if;
end $$;

-- Permisos: el público solo puede ejecutar estas funciones
revoke execute on function public.horas_ocupadas()   from public;
revoke execute on function public.config_promo()     from public;
revoke execute on function public.crear_cita(date, smallint, text, text, text, text, text) from public;
revoke execute on function public.adjuntar_disenos(uuid, text[]) from public;
revoke execute on function public.soy_admin()        from public;
grant execute on function public.horas_ocupadas()   to anon, authenticated;
grant execute on function public.config_promo()     to anon, authenticated;
grant execute on function public.crear_cita(date, smallint, text, text, text, text, text) to anon, authenticated;
grant execute on function public.adjuntar_disenos(uuid, text[]) to anon, authenticated;
grant execute on function public.soy_admin()        to authenticated;

-- ------------------------------------------------------------
-- 5) ALMACENAMIENTO PRIVADO PARA LOS DISEÑOS
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('disenos', 'disenos', false, 3145728, array['image/jpeg'])    -- privado, 3 MB, solo JPG
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "subir diseno a cita valida" on storage.objects;
drop policy if exists "admin ve disenos"           on storage.objects;
drop policy if exists "admin borra disenos"        on storage.objects;

create policy "subir diseno a cita valida" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'disenos' and public.puede_subir(name));

create policy "admin ve disenos" on storage.objects
    for select to authenticated
    using (bucket_id = 'disenos' and public.es_admin());

create policy "admin borra disenos" on storage.objects
    for delete to authenticated
    using (bucket_id = 'disenos' and public.es_admin());

-- ------------------------------------------------------------
-- 6) TIEMPO REAL: el panel se actualiza solo cuando entra una cita
-- ------------------------------------------------------------
do $$
begin
    alter publication supabase_realtime add table public.citas;
exception when duplicate_object then null;
end $$;
