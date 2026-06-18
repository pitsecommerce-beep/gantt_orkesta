'use client'

import { useMemo } from 'react'
import { useTable } from '@/lib/useData'
import { saldoCaja, balanceGeneral } from '@/lib/kpis'
import { formatMXN } from '@/lib/format'

export default function BalancePage() {
  const { data: movimientos } = useTable('movimientos_caja')
  const { data: aportaciones } = useTable('aportaciones_capital')
  const { data: gastos } = useTable('gastos')

  const balance = useMemo(() => {
    const caja = saldoCaja(movimientos)
    const equipoBruto = gastos.filter(g => g.categoria === 'equipo_computo').reduce((a, g) => a + g.monto, 0)
    const depreciacion = equipoBruto * 0.3
    const capitalSocial = aportaciones.reduce((a, ap) => a + ap.monto, 0)
    return balanceGeneral(caja, equipoBruto, depreciacion, 0, 0, 0, capitalSocial, 0, 0)
  }, [movimientos, aportaciones, gastos])

  const Fila = ({ label, value, indent }: { label: string; value: number; indent?: boolean }) => (
    <div className={`flex justify-between py-2 border-b border-sand ${indent ? 'pl-4' : ''}`}>
      <span className={indent ? 'text-dark/70 text-sm' : 'font-medium text-navy text-sm'}>{label}</span>
      <span className="font-mono text-navy text-sm">{formatMXN(value)}</span>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-navy mb-2">Balance General</h1>
      <p className="text-dark/60 mb-8">Posición financiera al día de hoy</p>

      {balance.balanceado ? (
        <div className="mb-6 p-4 bg-ok/10 border border-ok rounded-lg text-ok font-medium text-sm">
          ✓ Balance cuadrado — Activos = Pasivos + Capital
        </div>
      ) : (
        <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-lg text-danger font-medium text-sm">
          ⚠ Diferencia: {formatMXN(Math.abs(balance.diferencia))} — revisar cuentas pendientes de captura
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl text-navy mb-4">Activos</h2>
          <Fila label="Caja y equivalentes" value={balance.activos.caja} indent />
          <Fila label="Cuentas por cobrar" value={balance.activos.cuentasPorCobrar} indent />
          <Fila label="Equipo de cómputo (bruto)" value={balance.activos.equipoBruto} indent />
          <Fila label="Depreciación acumulada" value={-balance.activos.depreciacionAcumulada} indent />
          <Fila label="Equipo neto" value={balance.activos.equipoNeto} indent />
          <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
            <span className="font-serif font-bold text-navy">Total Activos</span>
            <span className="font-serif font-bold text-navy">{formatMXN(balance.activos.totalActivos)}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-t-[3px] border-gold rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl text-navy mb-4">Pasivos</h2>
            <Fila label="Cuentas por pagar" value={balance.pasivos.cuentasPorPagar} indent />
            <Fila label="Impuestos por pagar" value={balance.pasivos.impuestosPorPagar} indent />
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
              <span className="font-serif font-bold text-navy">Total Pasivos</span>
              <span className="font-serif font-bold text-navy">{formatMXN(balance.pasivos.totalPasivos)}</span>
            </div>
          </div>
          <div className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl text-navy mb-4">Capital Contable</h2>
            <Fila label="Capital social aportado" value={balance.capital.capitalSocial} indent />
            <Fila label="Reserva legal" value={balance.capital.reservaLegal} indent />
            <Fila label="Utilidades / pérdidas acum." value={balance.capital.utilidadesAcumuladas} indent />
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-navy">
              <span className="font-serif font-bold text-navy">Total Capital</span>
              <span className="font-serif font-bold text-navy">{formatMXN(balance.capital.totalCapital)}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 text-xs text-dark/40">
        Depreciación al 30% anual sobre equipo de cómputo registrado en Gastos. Cuentas por cobrar/pagar requieren captura manual.
      </p>
    </div>
  )
}
