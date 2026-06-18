// ============================================================================
// Orkesta Labs — Server-side resilient data fetchers.
// Supabase env vars may be absent; every call is wrapped so it returns
// empty arrays / null instead of throwing. This keeps the build and SSR safe.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type {
  MovimientoCaja,
  Ingreso,
  Gasto,
  Accionista,
  Empleado,
  CostoFijo,
  CostoVariable,
  Cliente,
  PlanMensual,
  ConfigEmpresa,
  AportacionCapital,
} from '@/lib/types'

async function safeSelect<T>(table: string): Promise<T[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*')
    if (error || !data) return []
    return data as T[]
  } catch {
    return []
  }
}

async function safeSingle<T>(table: string): Promise<T | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error || !data || data.length === 0) return null
    return data[0] as T
  } catch {
    return null
  }
}

export const getMovimientos = () =>
  safeSelect<MovimientoCaja>('movimientos_caja')
export const getIngresos = () => safeSelect<Ingreso>('ingresos')
export const getGastos = () => safeSelect<Gasto>('gastos')
export const getAccionistas = () => safeSelect<Accionista>('accionistas')
export const getEmpleados = () => safeSelect<Empleado>('empleados')
export const getCostosFijos = () => safeSelect<CostoFijo>('costos_fijos')
export const getCostosVariables = () =>
  safeSelect<CostoVariable>('costos_variables')
export const getClientes = () => safeSelect<Cliente>('clientes')
export const getPlanMensual = () => safeSelect<PlanMensual>('plan_mensual')
export const getAportaciones = () =>
  safeSelect<AportacionCapital>('aportaciones_capital')
export const getConfig = () => safeSingle<ConfigEmpresa>('config_empresa')
