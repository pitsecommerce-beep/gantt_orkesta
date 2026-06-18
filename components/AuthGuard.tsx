'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SessionResult = { data: { session: { user: unknown } | null }; error: unknown }

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    const isPublic = pathname?.includes('/login') || pathname?.includes('/auth')

    void (supabase.auth.getSession() as unknown as Promise<SessionResult>).then((res) => {
      if (!res?.data?.session && !isPublic) {
        router.replace('/login/')
      } else {
        setChecking(false)
      }
    }).catch(() => setChecking(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') setChecking(false)
      if (event === 'SIGNED_OUT') router.replace('/login/')
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (checking) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-navy font-serif text-lg animate-pulse">Cargando Orkesta…</div>
      </div>
    )
  }

  return <>{children}</>
}
