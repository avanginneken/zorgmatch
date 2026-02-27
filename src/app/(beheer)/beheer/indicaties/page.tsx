import { createClient } from '@/lib/supabase/server'
import { IndicatiesClient } from './IndicatiesClient'

export default async function IndicatiesPage() {
  const supabase = await createClient()
  const { data: tarieven } = await supabase
    .from('indicatie_tarieven')
    .select('*')
    .order('zorgtype')

  return <IndicatiesClient tarieven={tarieven || []} />
}
