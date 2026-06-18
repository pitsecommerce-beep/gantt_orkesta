import './globals.css'
import type { Metadata } from 'next'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Orkesta Labs · Administración Financiera',
  description: 'Dashboard financiero de Orkesta Labs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 bg-sand min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  )
}
