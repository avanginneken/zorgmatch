import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle, Clock, AlertCircle, Briefcase, FileText, TrendingUp } from 'lucide-react'

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

export default async function ZorgverlenerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id, naam, stad, lat, lng')
    .eq('auth_id', user?.id ?? '')
    .single()

  const { data: profiel } = await supabase
    .from('zorgverlener_profielen')
    .select('*')
    .eq('gebruiker_id', gebruiker?.id)
    .single()

  // Get available zorgvragen in area
  const { data: beschikbareVragen } = await supabase
    .from('zorgvragen')
    .select(`
      *,
      zorgvrager:gebruikers!zorgvragen_zorgvrager_id_fkey (naam, stad)
    `)
    .eq('status', 'OPEN')
    .limit(5)

  // Get my matches
  const { data: mijnMatches } = await supabase
    .from('matches')
    .select(`
      *,
      zorgvraag:zorgvragen (
        zorgtype, omschrijving, stad, indicatiebedrag, status
      )
    `)
    .eq('zorgverlener_id', gebruiker?.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(5)

  const isGoedgekeurd = profiel?.goedgekeurd
  const documentStatus = profiel?.document_status

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welkom, {gebruiker?.naam?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-600 mt-1">Uw zorgverlener dashboard</p>
      </div>

      {/* Goedkeuring status banner */}
      {!isGoedgekeurd && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          documentStatus === 'IN_BEHANDELING'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : documentStatus === 'AFGEKEURD'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            {documentStatus === 'IN_BEHANDELING' ? (
              <>
                <p className="font-medium">Uw account wordt beoordeeld</p>
                <p className="text-sm mt-0.5">
                  Wij controleren uw documenten. U ontvangt bericht zodra uw account is goedgekeurd.
                  Upload alvast uw documenten als u dat nog niet heeft gedaan.
                </p>
              </>
            ) : documentStatus === 'AFGEKEURD' ? (
              <>
                <p className="font-medium">Documenten afgekeurd</p>
                <p className="text-sm mt-0.5">
                  {profiel?.afwijzing_reden || 'Uw documenten zijn afgekeurd. Upload nieuwe documenten.'}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Account nog niet actief</p>
                <p className="text-sm mt-0.5">Upload uw documenten om uw account te activeren.</p>
              </>
            )}
            <Link href="/zorgverlener/documenten" className="text-sm font-medium underline mt-2 inline-block">
              Documenten uploaden →
            </Link>
          </div>
        </div>
      )}

      {isGoedgekeurd && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Uw account is goedgekeurd en actief. U ontvangt meldingen bij nieuwe zorgvragen.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{beschikbareVragen?.length || 0}</div>
          <div className="text-sm text-gray-600 mt-0.5">Open aanvragen nabij</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <Briefcase className="w-5 h-5 text-teal-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mijnMatches?.filter((m: any) => m.status === 'BEVESTIGD').length || 0}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">Actieve opdrachten</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mijnMatches?.filter((m: any) => m.status === 'AFGEROND').length || 0}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">Afgeronde opdrachten</div>
        </div>
      </div>

      {/* Beschikbare zorgvragen */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Beschikbare zorgvragen in uw gebied</h2>
          <Link href="/zorgverlener/opdrachten" className="text-sm text-blue-600 hover:underline">
            Alle opdrachten
          </Link>
        </div>

        {!isGoedgekeurd ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>Beschikbare zorgvragen zijn zichtbaar na goedkeuring van uw account</p>
          </div>
        ) : beschikbareVragen?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>Momenteel geen open zorgvragen in uw werkgebied</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {beschikbareVragen?.map((vraag: any) => (
              <div key={vraag.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {zorgtypeLabels[vraag.zorgtype] || vraag.zorgtype}
                      </span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Open
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{vraag.omschrijving}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>€{vraag.indicatiebedrag}/uur indicatie</span>
                      <span>·</span>
                      <span>{vraag.stad}</span>
                      <span>·</span>
                      <span>{new Date(vraag.aangemaakt_op).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>
                  <Link
                    href={`/zorgverlener/opdrachten/${vraag.id}`}
                    className="flex-shrink-0 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    Reageren
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mijn matches */}
      {mijnMatches && mijnMatches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Mijn opdrachten</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {mijnMatches.map((match: any) => (
              <div key={match.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">
                      {zorgtypeLabels[match.zorgvraag?.zorgtype] || match.zorgvraag?.zorgtype}
                    </span>
                    <div className="text-sm text-gray-500 mt-0.5">{match.zorgvraag?.stad}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    match.status === 'BEVESTIGD' ? 'bg-green-100 text-green-700' :
                    match.status === 'VOORGESTELD' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {match.status === 'VOORGESTELD' ? 'In behandeling' :
                     match.status === 'BEVESTIGD' ? 'Bevestigd' : 'Afgerond'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
