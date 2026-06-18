import { getConfig } from '@/lib/data'
import ConfigForm from '@/components/ConfigForm'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const config = await getConfig()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-navy mb-2">Configuración</h1>
      <p className="text-dark/60 mb-8">Parámetros del modelo financiero de Orkesta Labs</p>

      {!config ? (
        <div className="p-6 bg-warn/10 border border-warn rounded-lg text-warn">
          No se pudo cargar la configuración. Verifica la conexión con Supabase y que el seed haya corrido.
        </div>
      ) : (
        <ConfigForm config={config} />
      )}
    </div>
  )
}
