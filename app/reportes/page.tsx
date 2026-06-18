'use client'

import { useState } from 'react'
import { exportarExcel } from '@/lib/exportExcel'

const PERIODO_ACTUAL = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})()

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState(PERIODO_ACTUAL)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleExcel() {
    setLoadingExcel(true)
    setMsg(null)
    try {
      await exportarExcel(periodo)
      setMsg('Excel generado correctamente.')
    } catch {
      setMsg('Error al generar Excel. Verifica la conexión con Supabase.')
    } finally {
      setLoadingExcel(false)
    }
  }

  async function handlePdf() {
    setLoadingPdf(true)
    setMsg(null)
    try {
      const { exportarPdf } = await import('@/lib/exportPdf')
      await exportarPdf(periodo)
      setMsg('PDF generado correctamente.')
    } catch {
      setMsg('Error al generar PDF. Verifica la conexión con Supabase.')
    } finally {
      setLoadingPdf(false)
    }
  }

  const cards = [
    {
      titulo: 'Reporte Ejecutivo PDF',
      descripcion: 'Resumen ejecutivo para el Consejo de Administración. Incluye KPIs principales, alertas y resumen P&L con marca Orkesta.',
      accion: handlePdf,
      loading: loadingPdf,
      label: 'Descargar PDF',
      ext: 'pdf',
    },
    {
      titulo: 'Libro Financiero Excel',
      descripcion: 'Workbook con hojas: Dashboard KPIs, P&L, Gastos detallados, Ingresos, Balance General y Plan vs Real.',
      accion: handleExcel,
      loading: loadingExcel,
      label: 'Descargar Excel',
      ext: 'xlsx',
    },
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-navy mb-2">Reportes</h1>
      <p className="text-dark/60 mb-8">Genera y descarga reportes del periodo seleccionado</p>

      <div className="mb-8 flex items-center gap-4">
        <label className="text-sm font-medium text-navy">Periodo</label>
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border border-sand rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal"
        />
        <span className="text-xs text-dark/40">Archivo: Orkesta_Reporte_{periodo}</span>
      </div>

      {msg && (
        <div className="mb-6 p-3 bg-teal/10 border border-teal rounded-lg text-teal text-sm">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.titulo} className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-lg text-navy mb-1">{card.titulo}</h2>
              <p className="text-sm text-dark/60">{card.descripcion}</p>
            </div>
            <button
              onClick={card.accion}
              disabled={card.loading}
              className="mt-auto bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal transition-colors disabled:opacity-50"
            >
              {card.loading ? 'Generando...' : card.label}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-dark/40">
        Los reportes incluyen todos los datos registrados en la base de datos hasta la fecha de generación.
        Se nombrarán: <code>Orkesta_&lt;tipo&gt;_{periodo}.&lt;ext&gt;</code>
      </p>
    </div>
  )
}
