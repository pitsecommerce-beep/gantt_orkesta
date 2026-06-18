-- ============================================================================
-- Orkesta Labs — Row Level Security policies
-- Model:
--   * SELECT: any authenticated user (a perfiles row is created on first login).
--   * INSERT / UPDATE / DELETE: only users whose perfiles.rol = 'director'.
--   * perfiles: users read/update their own row; directors read all.
-- ============================================================================

-- Apply the standard SELECT + director-write policies to every data table.
do $$
declare
  t text;
  tbls text[] := array[
    'config_empresa','accionistas','aportaciones_capital','empleados',
    'costos_fijos','costos_variables','clientes','ingresos','gastos',
    'movimientos_caja','plan_mensual'
  ];
begin
  foreach t in array tbls loop
    -- clean re-run
    execute format('drop policy if exists %1$s_select on %1$s;', t);
    execute format('drop policy if exists %1$s_insert on %1$s;', t);
    execute format('drop policy if exists %1$s_update on %1$s;', t);
    execute format('drop policy if exists %1$s_delete on %1$s;', t);

    -- SELECT: any authenticated user (perfiles row created on first login)
    execute format($f$
      create policy %1$s_select on %1$s
        for select
        using (auth.role() = 'authenticated');
    $f$, t);

    -- INSERT: directors only
    execute format($f$
      create policy %1$s_insert on %1$s
        for insert
        with check (exists (
          select 1 from perfiles p
          where p.id = auth.uid() and p.rol = 'director'));
    $f$, t);

    -- UPDATE: directors only
    execute format($f$
      create policy %1$s_update on %1$s
        for update
        using (exists (
          select 1 from perfiles p
          where p.id = auth.uid() and p.rol = 'director'))
        with check (exists (
          select 1 from perfiles p
          where p.id = auth.uid() and p.rol = 'director'));
    $f$, t);

    -- DELETE: directors only
    execute format($f$
      create policy %1$s_delete on %1$s
        for delete
        using (exists (
          select 1 from perfiles p
          where p.id = auth.uid() and p.rol = 'director'));
    $f$, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- perfiles: self-service + director visibility
-- ----------------------------------------------------------------------------
drop policy if exists perfiles_select on perfiles;
drop policy if exists perfiles_update on perfiles;
drop policy if exists perfiles_insert on perfiles;

-- A user can read their own row; directors can read all rows.
create policy perfiles_select on perfiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'director')
  );

-- A user can update their own row.
create policy perfiles_update on perfiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- A user can insert their own perfil row (created on first login).
create policy perfiles_insert on perfiles
  for insert
  with check (id = auth.uid());
