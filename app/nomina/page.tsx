import DataTable from '@/components/DataTable'
import VacanteToggle from '@/components/VacanteToggle'
import { getEmpleados, getConfig, getMovimientos } from '@/lib/data'
import { saldoCaja, burnNetoPromedio, runway } from '@/lib/kpis'
import { formatMXN } from '@/lib/format'
import type { Empleado } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface EmpleadoRow extends Empleado {
  costo: number
}

export default async function NominaPage() {
  const [empleados, config, movimientos] = await Promise.all([
    getEmpleados(),
    getConfig(),
    getMovimientos(),
  ])

  const factor = config?.carga_patronal_factor ?? 1.3

  const rows: EmpleadoRow[] = empleados.map((e) => ({
    ...e,
    costo: e.sueldo_mensual * factor,
  }))

  const totalNomina = rows
    .filter(
      (e) =>
        e.activo && (e.tipo === 'interno' || e.tipo === 'externo')
    )
    .reduce((acc, e) => acc + e.costo, 0)

  const saldo = saldoCaja(movimientos)
  const burnProm = burnNetoPromedio(movimientos)
  const rw = runway(saldo, burnProm)

  const vacante = rows.find((e) => e.tipo === 'vacante')

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Nómina y Equipo</h1>
      </header>

      <div className="rounded-lg bg-white p-4 shadow-sm font-sans">
        <p className="text-xs uppercase text-dark/60">
          Nómina mensual (activos interno + externo)
        </p>
        <p className="font-serif text-2xl text-navy">
          {formatMXN(totalNomina)}
        </p>
      </div>

      <DataTable<EmpleadoRow>
        rows={rows}
        rowClassName={(r) =>
          r.tipo === 'externo' || r.tipo === 'vacante'
            ? 'border border-dashed border-gold'
            : ''
        }
        columns={[
          {
            key: 'nombre',
            label: 'Nombre',
            format: (v, r) => (
              <span className="inline-flex items-center gap-2">
                {v}
                {r.tipo === 'vacante' || r.por_confirmar ? (
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[10px] font-semibold">
                    POR CONFIRMAR
                  </span>
                ) : null}
              </span>
            ),
          },
          { key: 'puesto', label: 'Puesto' },
          { key: 'area', label: 'Área' },
          { key: 'tipo', label: 'Tipo' },
          {
            key: 'sueldo_mensual',
            label: 'Sueldo',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          {
            key: 'costo',
            label: `Costo (×${factor})`,
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          {
            key: 'activo',
            label: 'Activo',
            format: (v) => (v ? 'Sí' : 'No'),
          },
        ]}
      />

      {vacante ? (
        <VacanteToggle
          runwayActual={rw}
          saldo={saldo}
          burnActual={burnProm}
          vacanteCostoMensual={vacante.costo}
          vacanteNombre={vacante.puesto || vacante.nombre}
        />
      ) : null}
    </div>
  )
}
