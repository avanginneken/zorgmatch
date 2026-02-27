import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'

async function getZorgvragen(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', userId)
    .single()

  if (!gebruiker) return []

  const { data } = await supabase
    .from('zorgvragen')
    .select(`
      *,
      matches (
        id, status,
        zorgverlener:gebruikers!matches_zorgverlener_id_fkey (naam, stad)
      )
    `)
    .eq('zorgvrager_id', gebruiker.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(10)

  return data || []
}

const statusConfig = {
  OPEN: { label: 'Open', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  GEKOPPELD: { label: 'Gekoppeld', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  AFGEROND: { label: 'Afgerond', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  GEANNULEERD: { label: 'Geannuleerd', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

const zorgtypeLabels: Record<string, string> = {
  persoonlijke_verzorging: 'Persoonlijke verzorging',
  verpleging: 'Verpleging',
  begeleiding: 'Begeleiding',
  huishoudelijke_hulp: 'Huishoudelijke hulp',
  dagbesteding: 'Dagbesteding',
  nachtzorg: 'Nachtzorg',
  respijtzorg: 'Respijtzorg',
  geestelijke_gezondheidszorg: 'GGZ begeleiding',
}

export default async function ZorgvragerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id, naam, stad')
    .eq('auth_id', user?.id ?? '')
    .single()

  const zorgvragen = await getZorgvragen(user?.id ?? '', supabase)
  const openCount = zorgvragen.filter((z: any) => z.status === 'OPEN').length
  const gekoppeldCount = zorgvragen.filter((z: any) => z.status === 'GEKOPPELD').length
  const afgerondCount = zorgvragen.filter((z: any) => z.status === 'AFGEROND').length

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Goedemiddag, {gebruiker?.naam?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-600 mt-1">Hier ziet u een overzicht van uw zorgaanvragen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{openCount}</div>
          <div className="text-sm text-gray-600 mt-1">Open aanvragen</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{gekoppeldCount}</div>
          <div className="text-sm text-gray-600 mt-1">Gekoppeld</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{afgerondCount}</div>
          <div className="text-sm text-gray-600 mt-1">Afgerond</div>
        </div>
      </div>

      {/* New request CTA */}
      <Link
        href="/zorgvrager/zorgvraag/nieuw"
        className="flex items-center gap-4 bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition-colors"
      >
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold">Nieuwe zorgaanvraag</div>
          <div className="text-blue-200 text-sm">Beschrijf uw zorgbehoefte en vind snel een geschikte zorgverlener</div>
        </div>
      </Link>

      {/* Zorgvragen list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Mijn zorgaanvragen</h2>
          <Link href="/zorgvrager/zorgvragen" className="text-sm text-blue-600 hover:underline">
            Alle aanvragen
          </Link>
        </div>

        {zorgvragen.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Nog geen zorgaanvragen</p>
            <p className="text-sm text-gray-500">Dien uw eerste aanvraag in en wij koppelen u snel aan een zorgverlener</p>
            <Link
              href="/zorgvrager/zorgvraag/nieuw"
              className="mt-4 inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Aanvraag indienen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {zorgvragen.map((vraag: any) => {
              const status = statusConfig[vraag.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              return (
                <div key={vraag.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {zorgtypeLabels[vraag.zorgtype] || vraag.zorgtype}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{vraag.omschrijving}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>€{vraag.indicatiebedrag}/uur indicatie</span>
                        <span>·</span>
                        <span>{vraag.stad}</span>
                        <span>·</span>
                        <span>{new Date(vraag.aangemaakt_op).toLocaleDateString('nl-NL')}</span>
                      </div>
                      {vraag.matches && vraag.matches.length > 0 && (
                        <div className="mt-2 text-xs text-green-700 bg-green-50 inline-flex items-center gap-1 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          {vraag.matches.length} zorgverlener{vraag.matches.length > 1 ? 's' : ''} gereageerd
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
