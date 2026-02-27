import { createClient } from '@/lib/supabase/server'
import { GoedkeuringClient } from './GoedkeuringClient'

export default async function GoedkeuringPage() {
  const supabase = await createClient()

  const { data: wachtendZorgverleners } = await supabase
    .from('zorgverlener_profielen')
    .select(`
      *,
      gebruiker:gebruikers (id, naam, email, telefoon, stad, adres, aangemeld_op)
    `)
    .eq('goedgekeurd', false)
    .order('created_at', { ascending: false })

  const { data: goedgekeurdeZorgverleners } = await supabase
    .from('zorgverlener_profielen')
    .select(`
      *,
      gebruiker:gebruikers (id, naam, email, stad)
    `)
    .eq('goedgekeurd', true)
    .order('goedgekeurd_op', { ascending: false })
    .limit(10)

  return (
    <GoedkeuringClient
      wachtend={wachtendZorgverleners || []}
      goedgekeurd={goedgekeurdeZorgverleners || []}
    />
  )
}
