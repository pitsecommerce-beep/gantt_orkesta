'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandHeader from '@/components/BrandHeader'

const NAV: { label: string; href: string; icon: string }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Capital Social', href: '/capital', icon: '🏦' },
  { label: 'Nómina y Equipo', href: '/nomina', icon: '👥' },
  { label: 'Costos Fijos', href: '/costos', icon: '📌' },
  { label: 'Gastos', href: '/gastos', icon: '💸' },
  { label: 'Ingresos / Clientes', href: '/ingresos', icon: '📈' },
  { label: 'Balance General', href: '/balance', icon: '⚖️' },
  { label: 'Plan vs Real', href: '/plan-vs-real', icon: '🎯' },
  { label: 'Reportes', href: '/reportes', icon: '📄' },
  { label: 'Configuración', href: '/config', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-navy text-white min-h-screen p-4 shrink-0">
      <div className="bg-white rounded-lg p-3 mb-6">
        <BrandHeader />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm transition-colors ${
                active ? 'bg-teal text-white' : 'hover:bg-white/10'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
