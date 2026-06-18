'use client'

import type { Alerta, Severidad } from '@/lib/types'

interface AlertPanelProps {
  alertas: Alerta[]
  onMarcarVista?: (id: string) => void
}

const ordenSeveridad: Record<Severidad, number> = {
  danger: 0,
  warn: 1,
  info: 2,
  ok: 3,
}

const borde: Record<Severidad, string> = {
  danger: 'border-danger',
  warn: 'border-warn',
  info: 'border-teal',
  ok: 'border-ok',
}

const emoji: Record<Severidad, string> = {
  danger: '🔴',
  warn: '🟠',
  info: '🔵',
  ok: '🟢',
}

export default function AlertPanel({ alertas, onMarcarVista }: AlertPanelProps) {
  const ordenadas = [...alertas].sort(
    (a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad]
  )

  if (ordenadas.length === 0) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="font-sans text-sm text-dark/60">No hay alertas.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {ordenadas.map((alerta) => (
        <div
          key={alerta.id}
          className={`rounded-r-lg bg-white p-3 shadow-sm border-l-4 ${
            borde[alerta.severidad]
          } ${alerta.vista ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none" aria-hidden>
              {emoji[alerta.severidad]}
            </span>
            <div className="flex-1">
              <h4 className="font-serif font-semibold text-navy">
                {alerta.titulo}
              </h4>
              <p className="mt-0.5 font-sans text-sm text-dark/80">
                {alerta.mensaje}
              </p>
            </div>
            {onMarcarVista && !alerta.vista ? (
              <button
                type="button"
                onClick={() => onMarcarVista(alerta.id)}
                className="shrink-0 font-sans text-xs text-teal hover:underline"
              >
                Marcar como vista
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
