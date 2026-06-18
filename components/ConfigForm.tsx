'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConfigEmpresa } from '@/lib/types'

interface Field {
  key: keyof ConfigEmpresa
  label: string
  type: 'number' | 'text' | 'boolean'
  hint?: string
}

const FIELDS: Field[] = [
  { key: 'tipo_cambio_mxn_usd', label: 'Tipo de cambio MXN/USD', type: 'number', hint: 'Ej: 19' },
  { key: 'carga_patronal_factor', label: 'Factor carga patronal', type: 'number', hint: 'Ej: 1.35 (sueldo bruto × factor = costo empresa)' },
  { key: 'isr_tasa', label: 'ISR (decimal)', type: 'number', hint: 'Ej: 0.30 = 30%' },
  { key: 'ptu_tasa', label: 'PTU (decimal)', type: 'number', hint: 'Ej: 0.10 = 10%' },
  { key: 'reserva_legal_tasa', label: 'Reserva legal (decimal)', type: 'number', hint: 'Ej: 0.05 = 5%' },
  { key: 'margen_bruto_objetivo', label: 'Margen bruto objetivo (decimal)', type: 'number', hint: 'Ej: 0.30 = 30%' },
  { key: 'capital_social_autorizado', label: 'Capital social autorizado (MXN)', type: 'number' },
  { key: 'razon_social', label: 'Razón social', type: 'text' },
  { key: 'nombre_comercial', label: 'Nombre comercial', type: 'text' },
]

export default function ConfigForm({ config }: { config: ConfigEmpresa | null }) {
  const [values, setValues] = useState<Partial<ConfigEmpresa>>(config ?? {})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSave() {
    if (!config?.id) return
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('config_empresa')
      .update(values)
      .eq('id', config.id)
    setSaving(false)
    setMsg(error ? `Error: ${error.message}` : 'Configuración guardada.')
  }

  return (
    <div className="bg-white border-t-[3px] border-teal rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        {FIELDS.map(f => (
          <div key={f.key as string} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy">{f.label}</label>
            {f.type === 'boolean' ? (
              <input type="checkbox"
                checked={Boolean(values[f.key])}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.checked }))}
                className="w-5 h-5 accent-teal" />
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                step="any"
                value={String(values[f.key] ?? '')}
                onChange={e => setValues(v => ({ ...v, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                className="border border-sand rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal"
              />
            )}
            {f.hint && <p className="text-xs text-dark/40">{f.hint}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-teal transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-danger' : 'text-ok'}`}>{msg}</p>}
      </div>
      {config?.updated_at && (
        <p className="mt-3 text-xs text-dark/30">
          Última actualización: {new Date(config.updated_at).toLocaleString('es-MX')}
        </p>
      )}
    </div>
  )
}
