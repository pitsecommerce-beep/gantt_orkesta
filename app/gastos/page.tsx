'use client'

import { useTable } from '@/lib/useData'
import GastosCrud from '@/components/GastosCrud'

export default function GastosPage() {
  const { data: gastos, loading } = useTable('gastos')

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl text-navy mb-2">Gastos</h1>
      <p className="text-dark/60 mb-8">Registro transaccional de egresos</p>
      {loading ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando gastos…</div>
      ) : (
        <GastosCrud gastosIniciales={gastos} />
      )}
    </div>
  )
}
