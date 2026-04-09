import { ZorgvragenTable } from '@/components/tables/ZorgvragenTable'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

const DEMO_ZORGVRAGEN = [
  { id: 'd1', zorgtype: 'persoonlijke_verzorging', stad: 'Amsterdam', status: 'OPEN', aangemaakt_op: new Date().toISOString(), omschrijving: 'Hulp bij dagelijkse verzorging', indicatiebedrag: 45, zorgvrager: { naam: 'Maria de Vries', stad: 'Amsterdam' }, matches: [] },
  { id: 'd2', zorgtype: 'verpleging', stad: 'Utrecht', status: 'GEKOPPELD', aangemaakt_op: new Date(Date.now() - 86400000).toISOString(), omschrijving: 'Wondverzorging na operatie', indicatiebedrag: 55, zorgvrager: { naam: 'Petra Janssen', stad: 'Utrecht' }, matches: [{ id: 'm1' }] },
  { id: 'd3', zorgtype: 'huishoudelijke_hulp', stad: 'Rotterdam', status: 'OPEN', aangemaakt_op: new Date(Date.now() - 172800000).toISOString(), omschrijving: 'Hulp bij huishouden 2x per week', indicatiebedrag: 35, zorgvrager: { naam: 'Henk Bakker', stad: 'Rotterdam' }, matches: [] },
  { id: 'd4', zorgtype: 'begeleiding', stad: 'Den Haag', status: 'AFGEROND', aangemaakt_op: new Date(Date.now() - 604800000).toISOString(), omschrijving: 'Dagelijkse begeleiding en structuur', indicatiebedrag: 50, zorgvrager: { naam: 'Annie Smit', stad: 'Den Haag' }, matches: [{ id: 'm2' }] },
]

async function getZorgvragen() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('zorgvragen')
      .select('*, zorgvrager:gebruikers!zorgvragen_zorgvrager_id_fkey(naam, stad), matches(id)')
      .order('aangemaakt_op', { ascending: false })
    return data || []
  } catch {
    return []
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

export default async function BeheerZorgvragenPage() {
  const [items, isDemo] = await Promise.all([getZorgvragen(), isDemoSessie()])
  const zorgvragen = isDemo && items.length === 0 ? DEMO_ZORGVRAGEN : items

  const counts = {
    OPEN: zorgvragen.filter((z: any) => z.status === 'OPEN').length,
    GEKOPPELD: zorgvragen.filter((z: any) => z.status === 'GEKOPPELD').length,
    AFGEROND: zorgvragen.filter((z: any) => z.status === 'AFGEROND').length,
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zorgvragen</h1>
        <p className="text-gray-600 mt-1">Alle ingediende zorgaanvragen op het platform</p>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Demo-modus: voorbeelddata wordt getoond.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', count: counts.OPEN, color: 'text-amber-600' },
          { label: 'Gekoppeld', count: counts.GEKOPPELD, color: 'text-green-600' },
          { label: 'Afgerond', count: counts.AFGEROND, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-sm text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <ZorgvragenTable zorgvragen={zorgvragen as any} />
    </div>
  )
}
