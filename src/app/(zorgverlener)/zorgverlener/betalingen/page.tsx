import { createClient } from '@/lib/supabase/server'
import { Euro, TrendingUp } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Openstaand', color: 'text-amber-600 bg-amber-50' },
  BETAALD: { label: 'Uitbetaald', color: 'text-green-600 bg-green-50' },
  MISLUKT: { label: 'Mislukt', color: 'text-red-600 bg-red-50' },
  TERUGBETAALD: { label: 'Terugbetaald', color: 'text-blue-600 bg-blue-50' },
}

export default async function ZorgverlenerBetalingenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', user?.id ?? '')
    .single()

  const { data: betalingen } = await supabase
    .from('betalingen')
    .select('*, match:matches(zorgvraag:zorgvragen(zorgtype, stad))')
    .eq('zorgverlener_id', gebruiker?.id ?? '')
    .order('aangemaakt_op', { ascending: false })

  const items = betalingen || []
  const totaalUitbetaald = items
    .filter((b: any) => b.status === 'BETAALD')
    .reduce((sum: number, b: any) => sum + ((b.bedrag || 0) - (b.commissie || 0)), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Betalingen</h1>
        <p className="text-gray-600 mt-1">Overzicht van uw uitbetalingen (na 10% platformcommissie)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <Euro className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">€{totaalUitbetaald.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-1">Totaal uitbetaald</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          <div className="text-sm text-gray-600 mt-1">Totaal transacties</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <Euro className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-1">Nog geen uitbetalingen</h3>
            <p className="text-sm text-gray-500">Uitbetalingen verschijnen hier na afronding van een opdracht</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Opdracht</span>
              <span>Netto bedrag</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((b: any) => {
                const st = statusLabels[b.status] || { label: b.status, color: 'text-gray-600 bg-gray-50' }
                const netto = ((b.bedrag || 0) - (b.commissie || 0)).toFixed(2)
                return (
                  <div key={b.id} className="px-5 py-4 grid grid-cols-4 items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-900">
                        {b.match?.zorgvraag?.stad || 'Opdracht'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.aangemaakt_op).toLocaleDateString('nl-NL')} · commissie: €{b.commissie?.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">€{netto}</span>
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
