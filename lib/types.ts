// ============================================================================
// Orkesta Labs — Database type definitions
// All monetary amounts are in MXN unless a `moneda` / currency column says USD.
// ============================================================================

export type Moneda = 'MXN' | 'USD'
export type Severidad = 'ok' | 'warn' | 'danger' | 'info'
export type Rol = 'director' | 'lectura'

export interface ConfigEmpresa {
  id: string
  razon_social: string
  nombre_comercial: string
  tipo_sociedad: string
  rfc: string | null
  moneda_base: Moneda
  tipo_cambio_mxn_usd: number
  carga_patronal_factor: number // e.g. 1.30 (sueldo bruto × factor = costo empresa)
  isr_tasa: number // 0.30
  ptu_tasa: number // 0.10
  reserva_legal_tasa: number // 0.05
  margen_bruto_objetivo: number // 0.30
  capital_social_autorizado: number
  fecha_inicio_operaciones: string | null
  created_at: string
  updated_at: string
}

export interface Accionista {
  id: string
  nombre: string
  serie: string // 'A' | 'B' ...
  porcentaje: number // 0..100
  tiene_veto: boolean
  capital_comprometido: number // MXN
  capital_aportado: number // MXN
  por_confirmar: boolean
  created_at: string
  updated_at: string
}

export interface AportacionCapital {
  id: string
  accionista_id: string
  monto: number // MXN
  moneda: Moneda
  fecha: string // date
  confirmada: boolean
  nota: string | null
  created_at: string
  updated_at: string
}

export type TipoEmpleado = 'interno' | 'externo' | 'vacante'

export interface Empleado {
  id: string
  nombre: string
  puesto: string
  area: string
  tipo: TipoEmpleado
  sueldo_mensual: number // MXN bruto
  moneda: Moneda
  activo: boolean
  por_confirmar: boolean
  fecha_ingreso: string | null
  created_at: string
  updated_at: string
}

export interface CostoFijo {
  id: string
  concepto: string
  categoria: string
  monto: number
  moneda: Moneda
  recurrente: boolean // true = monthly, false = one-off
  mes_aplicacion: number | null // for one-off: which month index (1..)
  proveedor: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type ModeloPrecio = 'retail' | 'schools' | 'consulting'

export interface CostoVariable {
  id: string
  concepto: string
  modelo: ModeloPrecio
  unidad: string // 'tier', 'school/mes', 'proyecto'
  precio_unitario: number
  moneda: Moneda
  nota: string | null
  created_at: string
  updated_at: string
}

export type TipoIngreso = 'poc' | 'recurrente' | 'consulting'

export interface Ingreso {
  id: string
  cliente_id: string | null
  concepto: string
  tipo: TipoIngreso
  monto: number
  moneda: Moneda
  mes: number // 1..12
  anio: number
  fecha: string
  recurrente: boolean
  created_at: string
  updated_at: string
}

export interface Gasto {
  id: string
  concepto: string
  categoria: string
  proveedor: string | null
  monto: number
  moneda: Moneda
  mes: number
  anio: number
  fecha: string
  es_cogs: boolean // counts toward COGS (cost of goods sold)
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  segmento: ModeloPrecio
  contacto: string | null
  mrr: number // MXN
  activo: boolean
  created_at: string
  updated_at: string
}

export type TipoMovimiento = 'ingreso' | 'egreso' | 'aportacion'

export interface MovimientoCaja {
  id: string
  tipo: TipoMovimiento
  monto: number // MXN (positive for inflow, negative for outflow)
  concepto: string
  origen_tabla: string | null // 'ingresos' | 'gastos' | 'aportaciones_capital'
  origen_id: string | null
  mes: number
  anio: number
  fecha: string
  created_at: string
  updated_at: string
}

export interface PlanMensual {
  id: string
  mes_index: number // 1..24
  mes: number // 1..12
  anio: number
  ingresos_plan: number
  cogs_plan: number
  opex_plan: number
  utilidad_neta_plan: number
  nota: string | null
  created_at: string
  updated_at: string
}

export interface Perfil {
  id: string // = auth.users.id
  email: string
  nombre: string | null
  rol: Rol
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------------------
// Derived / view models
// ----------------------------------------------------------------------------

export interface Alerta {
  id: string
  severidad: Severidad
  titulo: string
  mensaje: string
  vista: boolean
}

export interface BalanceGeneral {
  activos: {
    caja: number
    cuentasPorCobrar: number
    equipoBruto: number
    depreciacionAcumulada: number
    equipoNeto: number
    totalActivos: number
  }
  pasivos: {
    cuentasPorPagar: number
    impuestosPorPagar: number
    totalPasivos: number
  }
  capital: {
    capitalSocial: number
    reservaLegal: number
    utilidadesAcumuladas: number
    totalCapital: number
  }
  balanceado: boolean
  diferencia: number
}
