import { GoedkeuringClient } from './GoedkeuringClient'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

async function getProfielen() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const [wachtendRes, goedgekeurdRes] = await Promise.all([
      supabase
        .from('zorgverlener_profielen')
        .select(`*, gebruiker:gebruikers (id, naam, email, telefoon, stad, adres, aangemeld_op)`)
        .eq('goedgekeurd', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('zorgverlener_profielen')
        .select(`*, gebruiker:gebruikers (id, naam, email, stad)`)
        .eq('goedgekeurd', true)
        .order('goedgekeurd_op', { ascending: false })
        .limit(20),
    ])

    return {
      wachtend: wachtendRes.data || [],
      goedgekeurd: goedgekeurdRes.data || [],
    }
  } catch {
    return { wachtend: [], goedgekeurd: [] }
  }
}

async function isDemoSessie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return !!cookieStore.get(DEMO_COOKIE)?.value
  } catch {
    return false
  }
}

const DEMO_WACHTEND = [
  {
    id: 'demo-1',
    gebruiker_id: 'demo-user-2',
    big_registratie: '99012345678',
    kvk_nummer: '12345678',
    zorgtypes: ['persoonlijke_verzorging', 'begeleiding'],
    werkgebied_km: 25,
    uurtarief: 48,
    bio: 'Ervaren zorgverlener met 10 jaar praktijkervaring in de thuiszorg.',
    goedgekeurd: false,
    goedgekeurd_op: null,
    document_status: 'IN_BEHANDELING',
    gebruiker: {
      id: 'demo-user-2',
      naam: 'Jan Verpleging',
      email: 'verlener@test.nl',
      telefoon: '06-12345678',
      stad: 'Utrecht',
      adres: 'Voorbeeldstraat 1',
      aangemeld_op: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  {
    id: 'demo-2',
    gebruiker_id: 'demo-user-4',
    big_registratie: '12398765432',
    kvk_nummer: '87654321',
    zorgtypes: ['verpleging', 'nachtzorg'],
    werkgebied_km: 15,
    uurtarief: 55,
    bio: 'Verpleegkundige niveau 5, gespecialiseerd in nachtzorg en palliatieve zorg.',
    goedgekeurd: false,
    goedgekeurd_op: null,
    document_status: 'IN_BEHANDELING',
    gebruiker: {
      id: 'demo-user-4',
      naam: 'Ahmed Yilmaz',
      email: 'ahmed@example.nl',
      telefoon: '06-87654321',
      stad: 'Den Haag',
      adres: 'Testlaan 42',
      aangemeld_op: new Date(Date.now() - 172800000).toISOString(),
    },
  },
]

export default async function GoedkeuringPage() {
  const [profielen, isDemo] = await Promise.all([getProfielen(), isDemoSessie()])

  const wachtend = isDemo && profielen.wachtend.length === 0 ? DEMO_WACHTEND : profielen.wachtend
  const goedgekeurd = profielen.goedgekeurd

  return (
    <div className="space-y-6 max-w-4xl">
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Demo-modus: voorbeelddata wordt getoond. Goedkeuren/afkeuren werkt alleen met echte accounts.
        </div>
      )}
      <GoedkeuringClient wachtend={wachtend as any} goedgekeurd={goedgekeurd as any} />
    </div>
  )
}
