import { createClient } from '@/lib/supabase/server'
import { Bell, CheckCircle } from 'lucide-react'

const typeLabels: Record<string, string> = {
  NIEUWE_ZORGVRAAG: 'Nieuwe zorgvraag in uw gebied',
  MATCH_BEVESTIGD: 'Match bevestigd',
  MATCH_GEANNULEERD: 'Match geannuleerd',
  DOCUMENT_GOEDGEKEURD: 'Document goedgekeurd',
  DOCUMENT_AFGEKEURD: 'Document afgekeurd',
  BETALING_ONTVANGEN: 'Betaling ontvangen',
}

export default async function NotificatiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', user?.id ?? '')
    .single()

  const { data: notificaties } = await supabase
    .from('notificaties')
    .select('*')
    .eq('gebruiker_id', gebruiker?.id ?? '')
    .order('aangemaakt_op', { ascending: false })

  const items = notificaties || []
  const ongelezen = items.filter((n: any) => !n.gelezen).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaties</h1>
          <p className="text-gray-600 mt-1">
            {ongelezen > 0 ? `${ongelezen} ongelezen berichten` : 'Alle berichten gelezen'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-1">Geen notificaties</h3>
            <p className="text-sm text-gray-500">U ontvangt hier meldingen over uw zorgaanvragen en matches</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((n: any) => (
              <div
                key={n.id}
                className={`px-5 py-4 flex items-start gap-4 ${!n.gelezen ? 'bg-blue-50/50' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.gelezen ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {n.gelezen
                    ? <CheckCircle className="w-4 h-4 text-gray-400" />
                    : <Bell className="w-4 h-4 text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.gelezen ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {typeLabels[n.type] || n.type}
                  </p>
                  {n.bericht && (
                    <p className="text-sm text-gray-600 mt-0.5">{n.bericht}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.aangemaakt_op).toLocaleString('nl-NL')}
                  </p>
                </div>
                {!n.gelezen && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
