import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

const DEMO_ZORGVRAGEN = [
  { id: 'demo-z1', zorgtype: 'persoonlijke_verzorging', stad: 'Amsterdam', status: 'OPEN', aangemaakt_op: new Date().toISOString(), omschrijving: 'Hulp bij dagelijkse verzorging', matches: [] },
  { id: 'demo-z2', zorgtype: 'huishoudelijke_hulp', stad: 'Amsterdam', status: 'GEKOPPELD', aangemaakt_op: new Date(Date.now() - 604800000).toISOString(), omschrijving: 'Hulp bij huishouden 2x per week', matches: [{ id: 'm1' }] },
]

async function isDemoZorgvrager(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (!demoCookie) return false
    const session = JSON.parse(decodeURIComponent(demoCookie.value))
    return session.rol === 'ZORGVRAGER'
  } catch {
    return false
  }
}

export async function GET() {
  // Demo-sessie
  if (await isDemoZorgvrager()) {
    return NextResponse.json({ zorgvragen: DEMO_ZORGVRAGEN })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data: gebruiker } = await supabase
      .from('gebruikers')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    if (!gebruiker || gebruiker.rol !== 'ZORGVRAGER') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data: zorgvragen, error } = await supabase
      .from('zorgvragen')
      .select('*, matches(id, status)')
      .eq('zorgvrager_id', gebruiker.id)
      .order('aangemaakt_op', { ascending: false })

    if (error) throw error

    return NextResponse.json({ zorgvragen: zorgvragen || [] })
  } catch (error) {
    console.error('Zorgvragen ophalen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
