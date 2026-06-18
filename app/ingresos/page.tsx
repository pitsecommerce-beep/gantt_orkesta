import IngresosCrud from '@/components/IngresosCrud'
import { getIngresos, getClientes } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function IngresosPage() {
  const [ingresos, clientes] = await Promise.all([getIngresos(), getClientes()])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Ingresos y Clientes</h1>
      </header>

      <IngresosCrud ingresosIniciales={ingresos} clientesIniciales={clientes} />
    </div>
  )
}
