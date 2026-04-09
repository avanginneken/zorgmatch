import { GebruikersTable } from '@/components/tables/GebruikersTable'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

async function getGebruikers() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('gebruikers')
      .select(`
        id, naam, email, rol, stad, aangemeld_op, actief,
        zorgverlener_profielen (goedgekeurd, document_status)
      `)
      .order('aangemeld_op', { ascending: false })

    return data || []
  } catch {
    // Admin client niet beschikbaar (demo-modus of ontbrekende service role key)
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

export default async function GebruikersPage() {
  const [items, isDemo] = await Promise.all([getGebruikers(), isDemoSessie()])

  const demoGebruikers = isDemo && items.length === 0 ? [
    { id: '1', naam: 'Maria de Vries', email: 'vrager@test.nl', rol: 'ZORGVRAGER', stad: 'Amsterdam', aangemeld_op: new Date().toISOString(), actief: true, zorgverlener_profielen: [] },
    { id: '2', naam: 'Jan Verpleging', email: 'verlener@test.nl', rol: 'ZORGVERLENER', stad: 'Utrecht', aangemeld_op: new Date().toISOString(), actief: true, zorgverlener_profielen: [{ goedgekeurd: false, document_status: 'IN_BEHANDELING' }] },
    { id: '3', naam: 'Petra Janssen', email: 'petra@example.nl', rol: 'ZORGVRAGER', stad: 'Rotterdam', aangemeld_op: new Date(Date.now() - 86400000).toISOString(), actief: true, zorgverlener_profielen: [] },
    { id: '4', naam: 'Ahmed Yilmaz', email: 'ahmed@example.nl', rol: 'ZORGVERLENER', stad: 'Den Haag', aangemeld_op: new Date(Date.now() - 172800000).toISOString(), actief: true, zorgverlener_profielen: [{ goedgekeurd: true, document_status: 'GOEDGEKEURD' }] },
    { id: '5', naam: 'Admin Beheer', email: 'beheer@zorgmatch.nl', rol: 'BEHEER', stad: 'Amsterdam', aangemeld_op: new Date(Date.now() - 259200000).toISOString(), actief: true, zorgverlener_profielen: [] },
  ] : items

  const totaal = demoGebruikers.length
  const zorgvragers = demoGebruikers.filter((g: any) => g.rol === 'ZORGVRAGER').length
  const zorgverleners = demoGebruikers.filter((g: any) => g.rol === 'ZORGVERLENER').length

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
        <p className="text-gray-600 mt-1">Overzicht van alle geregistreerde gebruikers</p>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Demo-modus: voorbeelddata wordt getoond. Registreer echte accounts om live data te zien.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-gray-900">{totaal}</div>
          <div className="text-sm text-gray-600">Totaal</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-blue-600">{zorgvragers}</div>
          <div className="text-sm text-gray-600">Zorgvragers</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-teal-600">{zorgverleners}</div>
          <div className="text-sm text-gray-600">Zorgverleners</div>
        </div>
      </div>

      <GebruikersTable gebruikers={demoGebruikers} />
    </div>
  )
}
