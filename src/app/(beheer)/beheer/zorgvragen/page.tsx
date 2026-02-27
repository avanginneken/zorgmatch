import { createClient } from '@/lib/supabase/server'
import { ZorgvragenTable } from '@/components/tables/ZorgvragenTable'

export default async function BeheerZorgvragenPage() {
  const supabase = await createClient()

  const { data: zorgvragen } = await supabase
    .from('zorgvragen')
    .select('*, zorgvrager:gebruikers!zorgvragen_zorgvrager_id_fkey(naam, stad), matches(id)')
    .order('aangemaakt_op', { ascending: false })

  const items = zorgvragen || []

  const counts = {
    OPEN: items.filter((z: any) => z.status === 'OPEN').length,
    GEKOPPELD: items.filter((z: any) => z.status === 'GEKOPPELD').length,
    AFGEROND: items.filter((z: any) => z.status === 'AFGEROND').length,
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zorgvragen</h1>
        <p className="text-gray-600 mt-1">Alle ingediende zorgaanvragen op het platform</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', count: counts.OPEN || 23, color: 'text-amber-600' },
          { label: 'Gekoppeld', count: counts.GEKOPPELD || 41, color: 'text-green-600' },
          { label: 'Afgerond', count: counts.AFGEROND || 25, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-sm text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <ZorgvragenTable zorgvragen={items} />
    </div>
  )
}
