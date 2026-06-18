import type React from 'react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: string
  status?: 'ok' | 'warn' | 'danger' | 'neutral'
  icon?: React.ReactNode
}

const statusDot: Record<NonNullable<KpiCardProps['status']>, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-gray-300',
}

const statusLabel: Record<NonNullable<KpiCardProps['status']>, string> = {
  ok: 'OK',
  warn: 'Atención',
  danger: 'Crítico',
  neutral: 'Neutral',
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  status = 'neutral',
  icon,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border-t-[3px] border-teal p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-teal">{icon}</span> : null}
          <span className="font-sans text-xs uppercase tracking-wide text-dark/60">
            {title}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 font-sans text-[10px] text-dark/70">
          <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />
          {statusLabel[status]}
        </span>
      </div>

      <div className="mt-2 font-serif text-2xl md:text-3xl text-navy leading-tight">
        {value}
      </div>

      {subtitle ? (
        <p className="mt-1 font-sans text-sm text-dark/70">{subtitle}</p>
      ) : null}

      {trend ? (
        <p className="mt-1 font-sans text-xs text-dark/60">{trend}</p>
      ) : null}
    </div>
  )
}
