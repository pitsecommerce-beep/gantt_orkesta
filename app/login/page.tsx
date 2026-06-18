'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandHeader from '@/components/BrandHeader'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/gantt_orkesta/dashboard/',
        },
      })
      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }
      setStatus('sent')
      setMessage('Te enviamos un enlace mágico. Revisa tu correo.')
    } catch {
      setStatus('error')
      setMessage('No se pudo conectar con el servicio de autenticación.')
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-sand p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6">
          <BrandHeader subtitle="Administración Financiera" />
        </div>

        <h1 className="mb-1 font-serif text-2xl text-navy">Iniciar sesión</h1>
        <p className="mb-6 font-sans text-sm text-dark/60">
          Ingresa tu correo para recibir un enlace de acceso.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-dark/70">Correo electrónico</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@orkesta.com"
              className="rounded-md border border-dark/20 px-3 py-2 outline-none focus:border-teal"
            />
          </label>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-md bg-teal px-4 py-2 font-semibold text-white transition-colors hover:bg-navy disabled:opacity-60"
          >
            {status === 'loading' ? 'Enviando…' : 'Enviar enlace mágico'}
          </button>
        </form>

        {message ? (
          <p
            className={`mt-4 font-sans text-sm ${
              status === 'error' ? 'text-danger' : 'text-ok'
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
