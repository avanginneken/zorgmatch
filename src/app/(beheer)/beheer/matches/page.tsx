import { createClient } from '@/lib/supabase/server'
import { Link2 } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  VOORGESTELD: { label: 'Voorgesteld', color: 'text-amber-700 bg-amber-50' },
  BEVESTIGD: { label: 'Bevestigd', color: 'text-green-700 bg-green-50' },
  AFGEROND: { label: 'Afgerond', color: 'text-blue-700 bg-blue-50' },
  GEANNULEERD: { label: 'Geannuleerd', color: 'text-gray-700 bg-gray-100' },
}

export default async function BeheerMatchesPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      zorgvraag:zorgvragen (zorgtype, stad, indicatiebedrag),
      zorgverlener:gebruikers!matches_zorgverlener_id_fkey (naam)
    `)
    .order('aangemaakt_op', { ascending: false })

  const items = matches || []
  const totaalCommissie = items
    .filter((m: any) => m.status === 'BEVESTIGD' || m.status === 'AFGEROND')
    .reduce((sum: number, m: any) => sum + (m.commissie_bedrag || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
        <p className="text-gray-600 mt-1">Alle koppelingen tussen zorgvragers en zorgverleners</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{items.length}</div>
          <div className="text-sm text-gray-600 mt-1">Totaal matches</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-3xl font-bold text-green-600">
            {items.filter((m: any) => m.status === 'BEVESTIGD').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Actief bevestigd</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="text-3xl font-bold text-teal-600">€{totaalCommissie.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-1">Totaal commissie</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <Link2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700">Nog geen matches</h3>
            <p className="text-sm text-gray-500 mt-1">Matches worden aangemaakt wanneer een zorgverlener reageert op een aanvraag</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-5 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Zorgverlener / Zorgvraag</span>
              <span>Stad</span>
              <span>Datum</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((m: any) => {
                const st = statusConfig[m.status] || { label: m.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <div key={m.id} className="px-5 py-3.5 grid grid-cols-5 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-900">{m.zorgverlener?.naam}</p>
                      <p className="text-xs text-gray-500">
                        {m.zorgvraag?.zorgtype?.replace(/_/g, ' ')} · €{m.zorgvraag?.indicatiebedrag}/uur
                      </p>
                    </div>
                    <span className="text-sm text-gray-600">{m.zorgvraag?.stad}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(m.aangemaakt_op).toLocaleDateString('nl-NL')}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
