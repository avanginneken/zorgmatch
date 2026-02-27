import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Clock, Euro } from 'lucide-react'

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

export default async function OpdrachtenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', user?.id ?? '')
    .single()

  const { data: profiel } = await supabase
    .from('zorgverlener_profielen')
    .select('goedgekeurd, zorgtypes, werkgebied_km')
    .eq('gebruiker_id', gebruiker?.id)
    .single()

  const { data: zorgvragen } = await supabase
    .from('zorgvragen')
    .select('*')
    .eq('status', 'OPEN')
    .order('aangemaakt_op', { ascending: false })

  if (!profiel?.goedgekeurd) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Beschikbare opdrachten</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-medium text-amber-800">Account in behandeling</p>
          <p className="text-sm text-amber-700 mt-1">
            U kunt beschikbare opdrachten zien nadat uw account is goedgekeurd.
          </p>
          <Link href="/zorgverlener/documenten" className="mt-4 inline-block text-sm text-blue-600 font-medium hover:underline">
            Documenten uploaden →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beschikbare opdrachten</h1>
        <p className="text-gray-600 mt-1">
          Zorgvragen in uw werkgebied ({profiel?.werkgebied_km || 10} km radius)
        </p>
      </div>

      {zorgvragen?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          <p>Momenteel geen open zorgvragen in uw werkgebied</p>
          <p className="text-sm mt-1">Wij sturen u automatisch een melding zodra er een passende aanvraag is</p>
        </div>
      ) : (
        <div className="space-y-4">
          {zorgvragen?.map((vraag: any) => (
            <div key={vraag.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {zorgtypeLabels[vraag.zorgtype] || vraag.zorgtype}
                    </h3>
                    <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      Open
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">{vraag.omschrijving}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {vraag.stad}
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="w-4 h-4" />
                      €{vraag.indicatiebedrag}/uur indicatie
                    </span>
                    {vraag.uren_per_week && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {vraag.uren_per_week} uur/week
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Geplaatst op {new Date(vraag.aangemaakt_op).toLocaleDateString('nl-NL', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <Link
                  href={`/zorgverlener/opdrachten/${vraag.id}`}
                  className="flex-shrink-0 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Bekijken & reageren
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
