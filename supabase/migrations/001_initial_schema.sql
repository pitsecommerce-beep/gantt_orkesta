-- ============================================================================
-- Orkesta Labs, S.A.P.I. de C.V. — Initial schema
-- Postgres / Supabase
-- All monetary amounts are in MXN unless a `moneda` column says USD.
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enum types (wrapped in DO blocks so re-running does not error)
-- ----------------------------------------------------------------------------
do $$ begin
  create type moneda_enum as enum ('MXN', 'USD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_empleado_enum as enum ('interno', 'externo', 'vacante');
exception when duplicate_object then null; end $$;

do $$ begin
  create type modelo_precio_enum as enum ('retail', 'schools', 'consulting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_ingreso_enum as enum ('poc', 'recurrente', 'consulting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento_enum as enum ('ingreso', 'egreso', 'aportacion');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rol_enum as enum ('director', 'lectura');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- config_empresa
-- ----------------------------------------------------------------------------
create table if not exists config_empresa (
  id                        uuid primary key default gen_random_uuid(),
  razon_social              text not null,
  nombre_comercial          text not null,
  tipo_sociedad             text not null,
  rfc                       text,
  moneda_base               moneda_enum not null default 'MXN',
  tipo_cambio_mxn_usd       numeric not null default 19,
  carga_patronal_factor     numeric not null default 1.30,
  isr_tasa                  numeric not null default 0.30,
  ptu_tasa                  numeric not null default 0.10,
  reserva_legal_tasa        numeric not null default 0.05,
  margen_bruto_objetivo     numeric not null default 0.30,
  capital_social_autorizado numeric not null default 0,
  fecha_inicio_operaciones  date,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- accionistas
-- ----------------------------------------------------------------------------
create table if not exists accionistas (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  serie                 text not null,
  porcentaje            numeric not null,            -- 0..100
  tiene_veto            boolean not null default false,
  capital_comprometido  numeric not null default 0,  -- MXN
  capital_aportado      numeric not null default 0,  -- MXN
  por_confirmar         boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- aportaciones_capital
-- ----------------------------------------------------------------------------
create table if not exists aportaciones_capital (
  id            uuid primary key default gen_random_uuid(),
  accionista_id uuid not null references accionistas(id),
  monto         numeric not null,            -- MXN
  moneda        moneda_enum not null default 'MXN',
  fecha         date not null,
  confirmada    boolean not null default false,
  nota          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- empleados
-- ----------------------------------------------------------------------------
create table if not exists empleados (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  puesto         text not null,
  area           text not null,
  tipo           tipo_empleado_enum not null,
  sueldo_mensual numeric not null default 0,   -- MXN bruto
  moneda         moneda_enum not null default 'MXN',
  activo         boolean not null default true,
  por_confirmar  boolean not null default false,
  fecha_ingreso  date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- costos_fijos
-- ----------------------------------------------------------------------------
create table if not exists costos_fijos (
  id             uuid primary key default gen_random_uuid(),
  concepto       text not null,
  categoria      text not null,
  monto          numeric not null default 0,
  moneda         moneda_enum not null default 'MXN',
  recurrente     boolean not null default true,    -- true = monthly, false = one-off
  mes_aplicacion integer,                          -- for one-off: which month index (1..)
  proveedor      text,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- costos_variables
-- ----------------------------------------------------------------------------
create table if not exists costos_variables (
  id              uuid primary key default gen_random_uuid(),
  concepto        text not null,
  modelo          modelo_precio_enum not null,
  unidad          text not null,                  -- 'tier', 'school/mes', 'proyecto'
  precio_unitario numeric not null default 0,
  moneda          moneda_enum not null default 'MXN',
  nota            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- clientes
-- ----------------------------------------------------------------------------
create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  segmento   modelo_precio_enum not null,
  contacto   text,
  mrr        numeric not null default 0,      -- MXN
  activo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ingresos
-- ----------------------------------------------------------------------------
create table if not exists ingresos (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  concepto   text not null,
  tipo       tipo_ingreso_enum not null,
  monto      numeric not null,
  moneda     moneda_enum not null default 'MXN',
  mes        integer not null,    -- 1..12
  anio       integer not null,
  fecha      date not null,
  recurrente boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- gastos
-- ----------------------------------------------------------------------------
create table if not exists gastos (
  id         uuid primary key default gen_random_uuid(),
  concepto   text not null,
  categoria  text not null,
  proveedor  text,
  monto      numeric not null,
  moneda     moneda_enum not null default 'MXN',
  mes        integer not null,
  anio       integer not null,
  fecha      date not null,
  es_cogs    boolean not null default false,  -- counts toward COGS
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- movimientos_caja
-- ----------------------------------------------------------------------------
create table if not exists movimientos_caja (
  id           uuid primary key default gen_random_uuid(),
  tipo         tipo_movimiento_enum not null,
  monto        numeric not null,             -- MXN (positive inflow, negative outflow)
  concepto     text not null,
  origen_tabla text,                         -- 'ingresos' | 'gastos' | 'aportaciones_capital'
  origen_id    uuid,
  mes          integer not null,
  anio         integer not null,
  fecha        date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- plan_mensual
-- ----------------------------------------------------------------------------
create table if not exists plan_mensual (
  id                 uuid primary key default gen_random_uuid(),
  mes_index          integer not null,    -- 1..24
  mes                integer not null,    -- 1..12
  anio               integer not null,
  ingresos_plan      numeric not null default 0,
  cogs_plan          numeric not null default 0,
  opex_plan          numeric not null default 0,
  utilidad_neta_plan numeric not null default 0,
  nota               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- perfiles  (id = auth.users.id)
-- ----------------------------------------------------------------------------
create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  nombre     text,
  rol        rol_enum not null default 'lectura',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Trigger: keep updated_at fresh on every UPDATE
-- ============================================================================
create or replace function actualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
  tbls text[] := array[
    'config_empresa','accionistas','aportaciones_capital','empleados',
    'costos_fijos','costos_variables','clientes','ingresos','gastos',
    'movimientos_caja','plan_mensual','perfiles'
  ];
begin
  foreach t in array tbls loop
    execute format('drop trigger if exists trg_updated_at_%1$s on %1$s;', t);
    execute format(
      'create trigger trg_updated_at_%1$s before update on %1$s
         for each row execute function actualizar_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- Trigger functions: auto-feed movimientos_caja
-- NOTE: config_empresa.tipo_cambio_mxn_usd is the source of truth for FX.
--       These triggers use a hardcoded fallback of 19 MXN/USD.
-- ============================================================================

-- ingresos -> movimientos_caja (inflow, positive)
create or replace function trg_ingreso_a_caja()
returns trigger as $$
declare
  v_monto_mxn numeric;
begin
  v_monto_mxn := new.monto * (case when new.moneda = 'USD' then 19 else 1 end);
  insert into movimientos_caja (tipo, monto, concepto, origen_tabla, origen_id, mes, anio, fecha)
  values ('ingreso', v_monto_mxn, new.concepto, 'ingresos', new.id, new.mes, new.anio, new.fecha);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ingreso_caja on ingresos;
create trigger trg_ingreso_caja
  after insert on ingresos
  for each row execute function trg_ingreso_a_caja();

-- gastos -> movimientos_caja (outflow, negative)
create or replace function trg_gasto_a_caja()
returns trigger as $$
declare
  v_monto_mxn numeric;
begin
  v_monto_mxn := new.monto * (case when new.moneda = 'USD' then 19 else 1 end);
  insert into movimientos_caja (tipo, monto, concepto, origen_tabla, origen_id, mes, anio, fecha)
  values ('egreso', -v_monto_mxn, new.concepto, 'gastos', new.id, new.mes, new.anio, new.fecha);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_gasto_caja on gastos;
create trigger trg_gasto_caja
  after insert on gastos
  for each row execute function trg_gasto_a_caja();

-- aportaciones_capital -> movimientos_caja (inflow, only when confirmada)
create or replace function trg_aportacion_a_caja()
returns trigger as $$
declare
  v_monto_mxn numeric;
begin
  if new.confirmada then
    v_monto_mxn := new.monto * (case when new.moneda = 'USD' then 19 else 1 end);
    insert into movimientos_caja (tipo, monto, concepto, origen_tabla, origen_id, mes, anio, fecha)
    values (
      'aportacion',
      v_monto_mxn,
      coalesce(new.nota, 'Aportación de capital'),
      'aportaciones_capital',
      new.id,
      extract(month from new.fecha)::int,
      extract(year  from new.fecha)::int,
      new.fecha
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_aportacion_caja on aportaciones_capital;
create trigger trg_aportacion_caja
  after insert on aportaciones_capital
  for each row execute function trg_aportacion_a_caja();

-- ============================================================================
-- Enable Row Level Security on ALL tables (policies live in 002)
-- ============================================================================
alter table config_empresa        enable row level security;
alter table accionistas           enable row level security;
alter table aportaciones_capital  enable row level security;
alter table empleados             enable row level security;
alter table costos_fijos          enable row level security;
alter table costos_variables      enable row level security;
alter table clientes              enable row level security;
alter table ingresos              enable row level security;
alter table gastos                enable row level security;
alter table movimientos_caja      enable row level security;
alter table plan_mensual          enable row level security;
alter table perfiles              enable row level security;
