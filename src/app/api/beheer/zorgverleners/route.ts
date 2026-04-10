import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'
import { createClient as createServerClient } from '@/lib/supabase/server'

const DEMO_ZORGVERLENERS = [
  { id: 'demo-v1', naam: 'Jan Verpleging', stad: 'Utrecht', zorgtypes: ['persoonlijke_verzorging', 'begeleiding'], uurtarief: 48 },
  { id: 'demo-v2', naam: 'Ahmed Yilmaz', stad: 'Den Haag', zorgtypes: ['verpleging', 'nachtzorg'], uurtarief: 55 },
]

async function isBeheer(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (demoCookie?.value) {
      const session = JSON.parse(decodeURIComponent(demoCookie.value))
      if (session.rol === 'BEHEER') return true
    }
  } catch { /* ignore */ }
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase.from('gebruikers').select('rol').eq('auth_id', user.id).single()
    return data?.rol === 'BEHEER'
  } catch { return false }
}

export async function GET() {
  if (!(await isBeheer())) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  // Demo cookie → geef demo zorgverleners terug
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (demoCookie?.value) {
      return NextResponse.json({ zorgverleners: DEMO_ZORGVERLENERS })
    }
  } catch { /* ignore */ }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('zorgverlener_profielen')
      .select(`
        id,
        zorgtypes,
        uurtarief,
        werkgebied_km,
        gebruiker:gebruikers!zorgverlener_profielen_gebruiker_id_fkey (id, naam, stad)
      `)
      .eq('goedgekeurd', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const verleners = (data || []).map((p: any) => ({
      id: p.gebruiker?.id,
      profielId: p.id,
      naam: p.gebruiker?.naam,
      stad: p.gebruiker?.stad,
      zorgtypes: p.zorgtypes,
      uurtarief: p.uurtarief,
    }))

    return NextResponse.json({ zorgverleners: verleners })
  } catch (error) {
    console.error('Zorgverleners ophalen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
