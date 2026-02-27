import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReagerenClient } from './ReagerenClient'

export default async function OpdrachtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: zorgvraag } = await supabase
    .from('zorgvragen')
    .select(`
      *,
      zorgvrager:gebruikers!zorgvragen_zorgvrager_id_fkey (naam, stad)
    `)
    .eq('id', id)
    .single()

  if (!zorgvraag) {
    notFound()
  }

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('id')
    .eq('auth_id', user!.id)
    .single()

  // Check if already reacted
  const { data: bestaandeMatch } = await supabase
    .from('matches')
    .select('id, status')
    .eq('zorgvraag_id', id)
    .eq('zorgverlener_id', gebruiker?.id)
    .single()

  return (
    <ReagerenClient
      zorgvraag={zorgvraag}
      bestaandeMatch={bestaandeMatch}
    />
  )
}
