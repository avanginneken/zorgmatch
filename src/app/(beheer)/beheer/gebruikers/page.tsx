import { createClient } from '@/lib/supabase/server'
import { GebruikersTable } from '@/components/tables/GebruikersTable'

export default async function GebruikersPage() {
  const supabase = await createClient()

  const { data: gebruikers } = await supabase
    .from('gebruikers')
    .select(`
      id, naam, email, rol, stad, aangemeld_op, actief,
      zorgverlener_profielen (goedgekeurd, document_status)
    `)
    .order('aangemeld_op', { ascending: false })

  const items = gebruikers || []
  const totaal = items.length
  const zorgvragers = items.filter((g: any) => g.rol === 'ZORGVRAGER').length
  const zorgverleners = items.filter((g: any) => g.rol === 'ZORGVERLENER').length

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
        <p className="text-gray-600 mt-1">Overzicht van alle geregistreerde gebruikers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-gray-900">{totaal || 103}</div>
          <div className="text-sm text-gray-600">Totaal</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-blue-600">{zorgvragers || 67}</div>
          <div className="text-sm text-gray-600">Zorgvragers</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xl font-bold text-teal-600">{zorgverleners || 34}</div>
          <div className="text-sm text-gray-600">Zorgverleners</div>
        </div>
      </div>

      <GebruikersTable gebruikers={items} />
    </div>
  )
}
