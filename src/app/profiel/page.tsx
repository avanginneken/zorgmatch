import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { User, Mail, Phone, MapPin, Shield } from 'lucide-react'
import { DEMO_COOKIE } from '@/lib/demo'

function isSupabaseConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
}

const rolLabels: Record<string, { label: string; color: string }> = {
  ZORGVRAGER: { label: 'Zorgvrager', color: 'text-blue-700 bg-blue-50' },
  ZORGVERLENER: { label: 'Zorgverlener (zzp)', color: 'text-teal-700 bg-teal-50' },
  BEHEER: { label: 'Beheerder', color: 'text-purple-700 bg-purple-50' },
}

export default async function ProfielPage() {
  let gebruiker: { naam: string; email: string; telefoon?: string; adres?: string; stad?: string; rol: string } | null = null

  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (demoCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(demoCookie.value))
        gebruiker = {
          naam: session.naam,
          email: session.rol === 'BEHEER' ? 'beheer@zorgmatch.nl' : session.rol === 'ZORGVERLENER' ? 'verlener@test.nl' : 'vrager@test.nl',
          rol: session.rol,
          stad: 'Amsterdam',
        }
      } catch { /* ignore */ }
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('gebruikers')
        .select('naam, email, telefoon, adres, stad, rol')
        .eq('auth_id', user.id)
        .single()
      gebruiker = data
    }
  }

  const rolInfo = gebruiker ? (rolLabels[gebruiker.rol] || { label: gebruiker.rol, color: 'bg-gray-100 text-gray-700' }) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mijn profiel</h1>
        <p className="text-gray-600 mt-1">Uw accountgegevens</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{gebruiker?.naam || '—'}</h2>
              {rolInfo && (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${rolInfo.color}`}>
                  {rolInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {[
            { icon: Mail, label: 'E-mailadres', value: gebruiker?.email },
            { icon: Phone, label: 'Telefoonnummer', value: gebruiker?.telefoon || '—' },
            { icon: MapPin, label: 'Stad', value: gebruiker?.stad || '—' },
            { icon: MapPin, label: 'Adres', value: gebruiker?.adres || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AVG notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Uw gegevens worden opgeslagen op beveiligde EU-servers (Frankfurt) conform de AVG-wetgeving.</p>
      </div>
    </div>
  )
}
