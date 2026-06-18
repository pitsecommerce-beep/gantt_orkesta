'use client'

import { useState } from 'react'
import { formatMeses } from '@/lib/format'

interface Props {
  runwayActual: number | 'rentable'
  saldo: number
  burnActual: number
  vacanteCostoMensual: number
  vacanteNombre: string
}

export default function VacanteToggle({
  runwayActual,
  saldo,
  burnActual,
  vacanteCostoMensual,
  vacanteNombre,
}: Props) {
  const [activa, setActiva] = useState(false)

  const nuevoBurn = burnActual + (activa ? vacanteCostoMensual : 0)
  const nuevoRunway: number | 'rentable' =
    nuevoBurn <= 0 ? 'rentable' : saldo / nuevoBurn

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm font-sans text-sm">
      <h3 className="font-serif text-lg text-navy mb-2">
        Impacto de vacante en runway
      </h3>
      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
        />
        <span>
          Activar vacante: <strong>{vacanteNombre}</strong> (
          {vacanteCostoMensual.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          }).replace('US', '')}
          /mes)
        </span>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-dark/60">Runway actual</p>
          <p className="font-serif text-xl text-navy">
            {formatMeses(runwayActual)}
          </p>
        </div>
        <div>
          <p className="text-dark/60">Runway proyectado</p>
          <p
            className={`font-serif text-xl ${
              activa ? 'text-warn' : 'text-navy'
            }`}
          >
            {formatMeses(nuevoRunway)}
          </p>
        </div>
      </div>
    </div>
  )
}
