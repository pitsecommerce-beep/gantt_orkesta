import { getMovimientos, getAportaciones, getGastos } from '@/lib/data'
import { saldoCaja, balanceGeneral } from '@/lib/kpis'
import { formatMXN } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function BalancePage() {
  const [movimientos, aportaciones, gastos] = await Promise.all([
    getMovimientos(),
    getAportaciones(),
    getGastos(),
  ])

  const caja = saldoCaja(movimientos)
  const equipoBruto = gastos
    .filter((g) => g.categoria === 'equipo_computo')
    .reduce((acc, g) => acc + g.monto, 0)
  const depreciacionAcumulada = equipoBruto * 0.3
  const capitalSocial = aportaciones.reduce((acc, a) => acc + a.monto, 0)

  const balance = balanceGeneral(caja, equipoBruto, depreciacionAcumulada, 0, 0, 0, capitalSocial, 0, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-navy mb-2">Balance General</h1>
      <p className="text-dark/60 mb-8">Posición financiera al día de hoy</p>

      {balance.balanceado ? (
        <div className="mb-6 p-4 bg-ok/10 border border-ok rounded-lg text-ok font-medium">
          ✓ Balance cuadrado — Activos = Pasivos + Capital
        </div>
      ) : (
        <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-lg text-danger font-medium">
          ⚠ Diferencia: {formatMXN(Math.abs(balance.diferencia))} — revisar cuentas pendientes
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl text-navy mb-4">Activos</h2>
          {[
            ['Caja y equivalentes', balance.activos.caja],
            ['Cuentas por cobrar', balance.activos.cuentasPorCobrar],
            ['Equipo de cómputo (bruto)', balance.activos.equipoBruto],
            ['Depreciación acumulada', -balance.activos.depreciacionAcumulada],
            ['Equipo neto', balance.activos.equipoNeto],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between py-2 border-b border-sand pl-4">
              <span className="text-dark/70 text-sm">{label as string}</span>
              <span className="font-mono text-navy text-sm">{formatMXN(value as number)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
            <span className="font-serif font-bold text-navy">Total Activos</span>
            <span className="font-serif font-bold text-navy">{formatMXN(balance.activos.totalActivos)}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-t-[3px] border-gold rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl text-navy mb-4">Pasivos</h2>
            {[
              ['Cuentas por pagar', balance.pasivos.cuentasPorPagar],
              ['Impuestos por pagar', balance.pasivos.impuestosPorPagar],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b border-sand pl-4">
                <span className="text-dark/70 text-sm">{label as string}</span>
                <span className="font-mono text-navy text-sm">{formatMXN(value as number)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
              <span className="font-serif font-bold text-navy">Total Pasivos</span>
              <span className="font-serif font-bold text-navy">{formatMXN(balance.pasivos.totalPasivos)}</span>
            </div>
          </div>

          <div className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl text-navy mb-4">Capital Contable</h2>
            {[
              ['Capital social aportado', balance.capital.capitalSocial],
              ['Reserva legal', balance.capital.reservaLegal],
              ['Utilidades / pérdidas acum.', balance.capital.utilidadesAcumuladas],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b border-sand pl-4">
                <span className="text-dark/70 text-sm">{label as string}</span>
                <span className="font-mono text-navy text-sm">{formatMXN(value as number)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
              <span className="font-serif font-bold text-navy">Total Capital</span>
              <span className="font-serif font-bold text-navy">{formatMXN(balance.capital.totalCapital)}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-dark/40">
        Depreciación calculada al 30 % anual sobre equipo de cómputo registrado en Gastos.
        Cuentas por cobrar/pagar requieren captura manual.
      </p>
    </div>
  )
}
