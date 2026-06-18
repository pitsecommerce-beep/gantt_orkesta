'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import type { ConfigEmpresa } from '@/lib/types'

type ConfigRecord = ConfigEmpresa & Record<string, unknown>

interface FormValues {
  tipo_cambio_mxn_usd: number
  isr_pct: number
  ptu_pct: number
  ptu_exenta_anio1: boolean
  iva_pct: number
  inflacion_anual_pct: number
  carga_patronal_factor: number
  margen_neto_objetivo_pct: number
  depreciacion_equipo_pct: number
  umbral_runway_meses: number
  umbral_crecimiento_costo_pct: number
}

function pctToDecimal(v: number) {
  return (Number(v) || 0) / 100
}
function decimalToPct(v: unknown) {
  return Math.round(((Number(v) || 0) * 100 + Number.EPSILON) * 100) / 100
}

export default function ConfigForm({ config }: { config: ConfigRecord | null }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    (config?.updated_at as string) ?? null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      tipo_cambio_mxn_usd: Number(config?.tipo_cambio_mxn_usd ?? 17),
      isr_pct: decimalToPct(config?.isr_tasa ?? 0.3),
      ptu_pct: decimalToPct(config?.ptu_tasa ?? 0.1),
      ptu_exenta_anio1: Boolean(config?.ptu_exenta_anio1 ?? true),
      iva_pct: decimalToPct(config?.iva_tasa ?? 0.16),
      inflacion_anual_pct: decimalToPct(config?.inflacion_anual ?? 0.04),
      carga_patronal_factor: Number(config?.carga_patronal_factor ?? 1.3),
      margen_neto_objetivo_pct: decimalToPct(config?.margen_neto_objetivo ?? 0.15),
      depreciacion_equipo_pct: decimalToPct(config?.depreciacion_equipo ?? 0.3),
      umbral_runway_meses: Number(config?.umbral_runway_meses ?? 6),
      umbral_crecimiento_costo_pct: decimalToPct(config?.umbral_crecimiento_costo ?? 0.2),
    },
  })

  const onSubmit = handleSubmit(async (v) => {
    setStatus('saving')
    setMessage(null)
    const payload = {
      tipo_cambio_mxn_usd: Number(v.tipo_cambio_mxn_usd) || 0,
      isr_tasa: pctToDecimal(v.isr_pct),
      ptu_tasa: pctToDecimal(v.ptu_pct),
      ptu_exenta_anio1: v.ptu_exenta_anio1,
      iva_tasa: pctToDecimal(v.iva_pct),
      inflacion_anual: pctToDecimal(v.inflacion_anual_pct),
      carga_patronal_factor: Number(v.carga_patronal_factor) || 0,
      margen_neto_objetivo: pctToDecimal(v.margen_neto_objetivo_pct),
      depreciacion_equipo: pctToDecimal(v.depreciacion_equipo_pct),
      umbral_runway_meses: Number(v.umbral_runway_meses) || 0,
      umbral_crecimiento_costo: pctToDecimal(v.umbral_crecimiento_costo_pct),
      updated_at: new Date().toISOString(),
    }
    try {
      const supabase = createClient()
      let error
      if (config?.id) {
        ;({ error } = await supabase
          .from('config_empresa')
          .update(payload)
          .eq('id', config.id))
      } else {
        ;({ error } = await supabase.from('config_empresa').insert(payload))
      }
      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }
      setStatus('saved')
      setUpdatedAt(payload.updated_at)
      setMessage('Configuración guardada.')
    } catch {
      setStatus('error')
      setMessage('No se pudo conectar con la base de datos.')
    }
  })

  const field = 'flex flex-col gap-1'
  const input = 'rounded border border-dark/20 px-2 py-1 outline-none focus:border-teal'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 font-sans text-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-white p-6 shadow-sm">
        <label className={field}>
          <span className="text-dark/60">Tipo de cambio MXN/USD</span>
          <input type="number" step="0.0001" {...register('tipo_cambio_mxn_usd', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">ISR %</span>
          <input type="number" step="0.01" {...register('isr_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">PTU %</span>
          <input type="number" step="0.01" {...register('ptu_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" {...register('ptu_exenta_anio1')} />
          <span className="text-dark/60">PTU exenta año 1</span>
        </label>
        <label className={field}>
          <span className="text-dark/60">IVA %</span>
          <input type="number" step="0.01" {...register('iva_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Inflación anual %</span>
          <input type="number" step="0.01" {...register('inflacion_anual_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Carga patronal (factor)</span>
          <input type="number" step="0.01" {...register('carga_patronal_factor', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Margen neto objetivo %</span>
          <input type="number" step="0.01" {...register('margen_neto_objetivo_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Depreciación equipo % anual</span>
          <input type="number" step="0.01" {...register('depreciacion_equipo_pct', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Umbral runway alerta (meses)</span>
          <input type="number" step="0.1" {...register('umbral_runway_meses', { valueAsNumber: true })} className={input} />
        </label>
        <label className={field}>
          <span className="text-dark/60">Umbral crecimiento costo alerta %</span>
          <input type="number" step="0.01" {...register('umbral_crecimiento_costo_pct', { valueAsNumber: true })} className={input} />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {status === 'saving' ? 'Guardando…' : 'Guardar'}
        </button>
        {updatedAt ? (
          <span className="text-dark/50">
            Última actualización: {new Date(updatedAt).toLocaleString('es-MX')}
          </span>
        ) : null}
      </div>

      {message ? (
        <p className={status === 'error' ? 'text-danger' : 'text-ok'}>{message}</p>
      ) : null}
    </form>
  )
}
