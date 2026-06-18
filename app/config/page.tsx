'use client'

import { useConfig } from '@/lib/useData'
import ConfigForm from '@/components/ConfigForm'

export default function ConfigPage() {
  const { config, loading } = useConfig()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-navy mb-2">Configuración</h1>
      <p className="text-dark/60 mb-8">Parámetros del modelo financiero de Orkesta Labs</p>

      {loading ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando configuración…</div>
      ) : !config ? (
        <div className="p-6 bg-warn/10 border border-warn rounded-lg text-warn text-sm">
          No se pudo cargar la configuración. Verifica la conexión con Supabase y que el seed haya corrido.
        </div>
      ) : (
        <ConfigForm config={config as unknown as Parameters<typeof ConfigForm>[0]["config"]} />
      )}
    </div>
  )
}
