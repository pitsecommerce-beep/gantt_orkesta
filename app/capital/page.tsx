import DataTable from '@/components/DataTable'
import AportacionesCrud from '@/components/AportacionesCrud'
import { getAccionistas, getAportaciones } from '@/lib/data'
import { capitalAportadoVsComprometido } from '@/lib/kpis'
import { formatMXN, formatPct } from '@/lib/format'
import type { Accionista } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CapitalPage() {
  const [accionistas, aportaciones] = await Promise.all([
    getAccionistas(),
    getAportaciones(),
  ])

  const resumen = capitalAportadoVsComprometido(accionistas, aportaciones)
  const hayPorConfirmar = accionistas.some((a) => a.por_confirmar)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Capital Social</h1>
      </header>

      {hayPorConfirmar ? (
        <div className="rounded-lg border-l-4 border-warn bg-white p-3 font-sans text-sm text-dark/80">
          ⚠ Datos por confirmar: hay accionistas con información pendiente de
          validar.
        </div>
      ) : null}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">Comprometido</p>
          <p className="font-serif text-2xl text-navy">
            {formatMXN(resumen.comprometido)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">Aportado</p>
          <p className="font-serif text-2xl text-navy">
            {formatMXN(resumen.aportado)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">
            Pendiente ({formatPct(resumen.porcentajeAportado)} aportado)
          </p>
          <p className="font-serif text-2xl text-navy">
            {formatMXN(resumen.pendiente)}
          </p>
        </div>
      </section>

      <DataTable<Accionista>
        rows={accionistas}
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'serie', label: 'Serie' },
          {
            key: 'porcentaje',
            label: '%',
            align: 'right',
            format: (v) => formatPct((Number(v) || 0) / 100),
          },
          {
            key: 'tiene_veto',
            label: 'Veto',
            format: (v) => (v ? 'Sí' : 'No'),
          },
          {
            key: 'capital_comprometido',
            label: 'Comprometido',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          {
            key: 'capital_aportado',
            label: 'Aportado',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
        ]}
      />

      <AportacionesCrud
        accionistas={accionistas}
        aportacionesIniciales={aportaciones}
      />
    </div>
  )
}
