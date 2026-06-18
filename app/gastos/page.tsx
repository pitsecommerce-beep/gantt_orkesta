import GastosCrud from '@/components/GastosCrud'
import { getGastos } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function GastosPage() {
  const gastos = await getGastos()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Gastos</h1>
        <p className="font-sans text-sm text-dark/60">
          Gastos transaccionales. Cada gasto registra un movimiento de caja (salida).
        </p>
      </header>

      <GastosCrud gastosIniciales={gastos} />
    </div>
  )
}
