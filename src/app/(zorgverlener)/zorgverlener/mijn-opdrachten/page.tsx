import { createClient } from '@/lib/supabase/server'
import { Briefcase, CheckCircle, Clock } from 'lucide-react'

const matchStatusConfig: Record<string, { label: string; color: string }> = {
  VOORGESTELD: { label: 'In behandeling', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  BEVESTIGD: { label: 'Actief', color: 'text-green-600 bg-green-50 border-green-200' },
  AFGEROND: { label: 'Afgerond', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  GEANNULEERD: { label: 'Geannuleerd', color: 'text-gray-600 bg-gray-50 border-gray-200' },
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

export default async function MijnOpdrachtenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', user?.id ?? '')
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      zorgvraag:zorgvragen (
        zorgtype, omschrijving, stad, indicatiebedrag, status,
        zorgvrager:gebruikers!zorgvragen_zorgvrager_id_fkey (naam)
      )
    `)
    .eq('zorgverlener_id', gebruiker?.id ?? '')
    .order('aangemaakt_op', { ascending: false })

  const items = matches || []
  const actief = items.filter((m: any) => m.status === 'BEVESTIGD').length
  const afgerond = items.filter((m: any) => m.status === 'AFGEROND').length

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mijn opdrachten</h1>
        <p className="text-gray-600 mt-1">Overzicht van uw actieve en afgeronde opdrachten</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{items.filter((m: any) => m.status === 'VOORGESTELD').length}</div>
          <div className="text-sm text-gray-600 mt-1">In behandeling</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <Briefcase className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{actief}</div>
          <div className="text-sm text-gray-600 mt-1">Actieve opdrachten</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <CheckCircle className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{afgerond}</div>
          <div className="text-sm text-gray-600 mt-1">Afgerond</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-1">Nog geen opdrachten</h3>
            <p className="text-sm text-gray-500">Reageer op beschikbare zorgvragen om opdrachten te ontvangen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((m: any) => {
              const st = matchStatusConfig[m.status] || { label: m.status, color: 'bg-gray-50 text-gray-600 border-gray-200' }
              return (
                <div key={m.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {zorgtypeLabels[m.zorgvraag?.zorgtype] || m.zorgvraag?.zorgtype}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {m.zorgvraag?.stad} · Zorgvrager: {m.zorgvraag?.zorgvrager?.naam}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(m.aangemaakt_op).toLocaleDateString('nl-NL')}
                        {m.zorgvraag?.indicatiebedrag && ` · €${m.zorgvraag.indicatiebedrag}/uur`}
                      </p>
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
