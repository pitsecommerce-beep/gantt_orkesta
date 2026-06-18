'use client'

import { useTable } from '@/lib/useData'
import DataTable from '@/components/DataTable'
import AportacionesCrud from '@/components/AportacionesCrud'
import { capitalAportadoVsComprometido } from '@/lib/kpis'
import { formatMXN, formatPct } from '@/lib/format'

export default function CapitalPage() {
  const { data: accionistas, loading: la } = useTable('accionistas')
  const { data: aportaciones, loading: lap } = useTable('aportaciones_capital')

  const resumen = capitalAportadoVsComprometido(accionistas, aportaciones)

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl text-navy">Capital Social</h1>
        <div className="mt-3 p-3 bg-warn/10 border border-warn rounded-lg text-warn text-sm font-medium">
          ⚠ Datos por confirmar contra acta constitutiva — revisar con notario antes de usar en reportes oficiales.
        </div>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-t-[3px] border-teal rounded-lg p-4 shadow-sm">
          <p className="text-xs text-dark/50 uppercase tracking-wide">Capital Comprometido</p>
          <p className="font-serif text-2xl text-navy mt-1">{formatMXN(resumen.comprometido)}</p>
        </div>
        <div className="bg-white border-t-[3px] border-teal rounded-lg p-4 shadow-sm">
          <p className="text-xs text-dark/50 uppercase tracking-wide">Capital Aportado</p>
          <p className="font-serif text-2xl text-navy mt-1">{formatMXN(resumen.aportado)}</p>
        </div>
        <div className="bg-white border-t-[3px] border-gold rounded-lg p-4 shadow-sm">
          <p className="text-xs text-dark/50 uppercase tracking-wide">% Aportado</p>
          <p className="font-serif text-2xl text-navy mt-1">{formatPct(resumen.porcentajeAportado)}</p>
        </div>
      </div>

      {/* Accionistas */}
      <section>
        <h2 className="font-serif text-xl text-navy mb-4">Accionistas</h2>
        {la ? (
          <div className="animate-pulse text-dark/40 py-4">Cargando…</div>
        ) : (
          <DataTable
            columns={[
              { key: 'nombre', label: 'Nombre' },
              { key: 'serie', label: 'Serie' },
              { key: 'porcentaje', label: '%', format: (v) => `${v}%` },
              { key: 'tiene_veto', label: 'Veto', format: (v) => v ? '✓' : '—' },
              { key: 'capital_comprometido', label: 'Comprometido', format: (v) => formatMXN(v as number) },
              { key: 'capital_aportado', label: 'Aportado', format: (v) => formatMXN(v as number) },
              { key: 'por_confirmar', label: 'Estado', format: (v) => v ? <span className="text-warn text-xs font-medium">POR CONFIRMAR</span> : <span className="text-ok text-xs">Confirmado</span> },
            ]}
            rows={accionistas}
          />
        )}
      </section>

      {/* Aportaciones */}
      <section>
        <h2 className="font-serif text-xl text-navy mb-4">Aportaciones de Capital</h2>
        {lap ? (
          <div className="animate-pulse text-dark/40 py-4">Cargando…</div>
        ) : (
          <AportacionesCrud aportacionesIniciales={aportaciones} accionistas={accionistas} />
        )}
      </section>
    </div>
  )
}
