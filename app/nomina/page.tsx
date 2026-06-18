'use client'

import { useMemo } from 'react'
import DataTable from '@/components/DataTable'
import VacanteToggle from '@/components/VacanteToggle'
import { useTable, useConfig } from '@/lib/useData'
import { saldoCaja, burnNetoPromedio, runway } from '@/lib/kpis'
import { formatMXN, formatMeses } from '@/lib/format'
import type { Empleado } from '@/lib/types'

type EmpleadoRow = Empleado & { costo: number }

export default function NominaPage() {
  const { data: empleados, loading } = useTable('empleados')
  const { data: movimientos } = useTable('movimientos_caja')
  const { config } = useConfig()

  const factor = config?.carga_patronal_factor ?? 1.3

  const rows: EmpleadoRow[] = useMemo(() =>
    empleados.map(e => ({ ...e, costo: e.sueldo_mensual * factor })),
    [empleados, factor])

  const totalNomina = rows
    .filter(e => e.activo && (e.tipo === 'interno' || e.tipo === 'externo'))
    .reduce((acc, e) => acc + e.costo, 0)

  const saldo = saldoCaja(movimientos)
  const burnProm = burnNetoPromedio(movimientos)
  const rw = runway(saldo, burnProm)


  return (
    <div className="p-8 flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Nómina y Equipo</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-t-[3px] border-teal rounded-lg p-4 shadow-sm">
          <p className="text-xs text-dark/50 uppercase tracking-wide">Nómina mensual activa</p>
          <p className="font-serif text-2xl text-navy mt-1">{formatMXN(totalNomina)}</p>
          <p className="text-xs text-dark/40 mt-1">Incluye carga patronal ×{factor}</p>
        </div>
        <div className="bg-white border-t-[3px] border-teal rounded-lg p-4 shadow-sm">
          <p className="text-xs text-dark/50 uppercase tracking-wide">Runway actual</p>
          <p className="font-serif text-2xl text-navy mt-1">{formatMeses(rw)}</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando equipo…</div>
      ) : (
        <DataTable<EmpleadoRow>
          rows={rows}
          rowClassName={r => (r.tipo === 'externo' || r.tipo === 'vacante') ? 'border border-dashed border-gold' : ''}
          columns={[
            { key: 'nombre', label: 'Nombre', format: (v, r) => (
              <span className="inline-flex items-center gap-2">
                {v}
                {(r.tipo === 'vacante' || r.por_confirmar) && (
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[10px] font-semibold">POR CONFIRMAR</span>
                )}
              </span>
            )},
            { key: 'puesto', label: 'Puesto' },
            { key: 'area', label: 'Área' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'sueldo_mensual', label: 'Sueldo bruto', align: 'right', format: v => formatMXN(v as number) },
            { key: 'costo', label: 'Costo empresa/mes', align: 'right', format: v => formatMXN(v as number) },
            { key: 'activo', label: 'Estado', format: (v, r) =>
              r.tipo === 'vacante'
                ?<VacanteToggle runwayActual={rw} saldo={saldoCaja(movimientos)} burnActual={burnProm} vacanteCostoMensual={r.costo} vacanteNombre={r.nombre} />
                : <span className={v ? 'text-ok text-xs font-medium' : 'text-dark/40 text-xs'}>
                    {v ? 'Activo' : 'Inactivo'}
                  </span>
            },
          ]}
        />
      )}
    </div>
  )
}
