'use client'

import { useTable } from '@/lib/useData'
import IngresosCrud from '@/components/IngresosCrud'

export default function IngresosPage() {
  const { data: ingresos, loading: li } = useTable('ingresos')
  const { data: clientes, loading: lc } = useTable('clientes')

  const mrrTotal = clientes.filter(c => c.activo).reduce((a, c) => a + (c.mrr ?? 0), 0)

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl text-navy mb-2">Ingresos y Clientes</h1>
      <p className="text-dark/60 mb-6">MRR total: <span className="font-serif text-navy font-bold">${mrrTotal.toLocaleString()} MXN</span></p>
      {(li || lc) ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando…</div>
      ) : (
        <IngresosCrud ingresosIniciales={ingresos} clientesIniciales={clientes} />
      )}
    </div>
  )
}
