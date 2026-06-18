'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  MovimientoCaja, Ingreso, Gasto, Accionista, Empleado,
  CostoFijo, CostoVariable, Cliente, PlanMensual,
  ConfigEmpresa, AportacionCapital,
} from '@/lib/types'

type TableMap = {
  movimientos_caja: MovimientoCaja
  ingresos: Ingreso
  gastos: Gasto
  accionistas: Accionista
  empleados: Empleado
  costos_fijos: CostoFijo
  costos_variables: CostoVariable
  clientes: Cliente
  plan_mensual: PlanMensual
  aportaciones_capital: AportacionCapital
}

export function useTable<T extends keyof TableMap>(table: T) {
  const [data, setData] = useState<TableMap[T][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from(table).select('*').then(({ data: rows }) => {
      setData((rows ?? []) as TableMap[T][])
      setLoading(false)
    }, () => {
      setLoading(false)
    })
  }, [table])

  return { data, loading }
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigEmpresa | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('config_empresa').select('*').maybeSingle().then(({ data }) => {
      setConfig(data ?? null)
      setLoading(false)
    }, () => {
      setLoading(false)
    })
  }, [])

  return { config, loading }
}
