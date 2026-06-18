-- ============================================================================
-- Orkesta Labs, S.A.P.I. de C.V. — Seed data
-- Rule: NO invented numbers. Values that are "por confirmar" are seeded as
--       0 / null with por_confirmar = true (where the column exists).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. config_empresa (single row)
-- ----------------------------------------------------------------------------
insert into config_empresa (
  razon_social, nombre_comercial, tipo_sociedad, rfc,
  moneda_base, tipo_cambio_mxn_usd, carga_patronal_factor,
  isr_tasa, ptu_tasa, reserva_legal_tasa, margen_bruto_objetivo,
  capital_social_autorizado, fecha_inicio_operaciones
) values (
  'Orkesta Labs, S.A.P.I. de C.V.', 'Orkesta Labs', 'S.A.P.I. de C.V.', null,
  'MXN', 19, 1.30,
  0.30, 0.10, 0.05, 0.30,
  0,                 -- capital_social_autorizado: por confirmar
  '2026-06-01'       -- operaciones inician junio 2026
);

-- ----------------------------------------------------------------------------
-- 2. accionistas (all por_confirmar; capital aún no aportado)
--    Serie A suma 100% (39 + 39 + 22). Pool de empleados es un option pool
--    en serie B (7.5%), separado de la mesa de serie A.
-- ----------------------------------------------------------------------------
insert into accionistas (nombre, serie, porcentaje, tiene_veto, capital_comprometido, capital_aportado, por_confirmar) values
  ('Francisco Tallabs', 'A', 39,   true,  0, 0, true),
  ('Rafael Goji',       'A', 39,   true,  0, 0, true),
  ('Miguel Oliva',      'A', 22,   true,  0, 0, true),
  ('Pool empleados',    'B', 7.5,  false, 0, 0, true);

-- ----------------------------------------------------------------------------
-- 3. empleados
--    Founders (Dirección, interno). Interns Leo / Alejandra / Gustavo.
--    Externos: Contador, Agencia Marketing. One vacante.
--    Sueldos NOT specified -> 0 + por_confirmar = true.
-- ----------------------------------------------------------------------------
insert into empleados (nombre, puesto, area, tipo, sueldo_mensual, moneda, activo, por_confirmar) values
  ('Francisco Tallabs', 'Co-founder / Director',   'Dirección',  'interno', 0, 'MXN', true,  true),
  ('Rafael Goji',       'Co-founder / Director',   'Dirección',  'interno', 0, 'MXN', true,  true),
  ('Miguel Oliva',      'Co-founder / Director',   'Dirección',  'interno', 0, 'MXN', true,  true),
  ('Leo',               'Gerente de Producto',     'Producto',   'interno', 0, 'MXN', true,  true),
  ('Alejandra',         'BDR',                     'Comercial',  'interno', 0, 'MXN', true,  true),
  ('Gustavo',           'Desarrollador Sr',        'Ingeniería', 'interno', 0, 'MXN', true,  true),
  ('Contador',          'Contador externo',        'Finanzas',   'externo', 0, 'MXN', true,  true),
  ('Agencia Marketing', 'Agencia de marketing',    'Marketing',  'externo', 0, 'MXN', true,  true),
  ('Vacante - Dev Jr',  'Desarrollador Jr',        'Ingeniería', 'vacante', 0, 'MXN', true,  true);

-- ----------------------------------------------------------------------------
-- 4. costos_fijos
--    Real recurring numbers: SaaS 930 USD, Contador 3000 MXN, Marketing 5000 MXN.
--    One-off legal (constitución) in month 1 with monto 0 (por confirmar).
-- ----------------------------------------------------------------------------
insert into costos_fijos (concepto, categoria, monto, moneda, recurrente, mes_aplicacion, proveedor, activo) values
  ('SaaS / herramientas',   'Software',  930,  'USD', true,  null, null,                true),
  ('Contador',              'Servicios', 3000, 'MXN', true,  null, 'Contador externo',  true),
  ('Marketing',             'Marketing', 5000, 'MXN', true,  null, 'Agencia Marketing', true),
  ('Constitución legal',    'Legal',     0,    'MXN', false, 1,    null,                true); -- monto por confirmar

-- ----------------------------------------------------------------------------
-- 5. costos_variables (pricing models)
--    Retail tiers: precio por confirmar -> 0 (nota describe tiers).
--    Schools: 10000 MXN por escuela/mes.  Consulting: por proyecto (0).
-- ----------------------------------------------------------------------------
insert into costos_variables (concepto, modelo, unidad, precio_unitario, moneda, nota) values
  ('Retail - tiers de precio', 'retail',     'tier',       0,     'MXN', 'Precios por tier por confirmar (estructura escalonada por volumen)'),
  ('Schools - suscripción',    'schools',    'school/mes', 10000, 'MXN', null),
  ('Consulting - proyecto',    'consulting', 'proyecto',   0,     'MXN', 'Precio por proyecto (cotización a medida)');

-- ----------------------------------------------------------------------------
-- 6. plan_mensual — 24 meses, inicio junio 2026 (mes_index 1 = 06/2026).
--    Solo el mes 1 tiene cifras reales de sanity-check (P50).
--    Meses 2..24: P50 por capturar -> 0 con nota.
-- ----------------------------------------------------------------------------
-- Month 1 (P50 sanity-check):
insert into plan_mensual (mes_index, mes, anio, ingresos_plan, cogs_plan, opex_plan, utilidad_neta_plan, nota) values
  (1, 6, 2026, 49672, 0, 138297, -92847,
   'P50 sanity-check. Nota: 49672 - 138297 = -88625; -92847 incluye otras partidas.');

-- Months 2..24: ramp placeholders, P50 por capturar.
do $$
declare
  i int;
  m int;
  y int;
begin
  for i in 2..24 loop
    m := ((6 - 1 + (i - 1)) % 12) + 1;     -- rolling month, base = junio (6)
    y := 2026 + ((6 - 1 + (i - 1)) / 12);  -- rolling year
    insert into plan_mensual (mes_index, mes, anio, ingresos_plan, cogs_plan, opex_plan, utilidad_neta_plan, nota)
    values (i, m, y, 0, 0, 0, 0, 'P50 por capturar');
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Note: aportaciones_capital are intentionally NOT seeded — all capital is
--       "por confirmar". Add rows once amounts/dates are confirmed, e.g.:
--   insert into aportaciones_capital (accionista_id, monto, moneda, fecha, confirmada, nota)
--   select id, 100000, 'MXN', current_date, true, 'Aportación inicial'
--   from accionistas where nombre = 'Francisco Tallabs';
-- ----------------------------------------------------------------------------
