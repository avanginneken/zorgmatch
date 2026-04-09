import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

async function getZorgvragerGebruikerId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('gebruikers')
    .select('id, rol')
    .eq('auth_id', user.id)
    .single()
  return data?.rol === 'ZORGVRAGER' ? data.id : null
}

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

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is verplicht' }, { status: 400 })
  }

  // Demo-sessie: simuleer succes
  if (await isDemoZorgvrager()) {
    return NextResponse.json({ success: true, demo: true })
  }

  try {
    const supabase = await createClient()
    const gebruikerId = await getZorgvragerGebruikerId(supabase)

    if (!gebruikerId) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Controleer of de zorgvraag van deze zorgvrager is en nog OPEN
    const { data: zorgvraag } = await supabase
      .from('zorgvragen')
      .select('id, status, zorgvrager_id')
      .eq('id', id)
      .single()

    if (!zorgvraag || zorgvraag.zorgvrager_id !== gebruikerId) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    }

    if (zorgvraag.status !== 'OPEN') {
      return NextResponse.json({ error: 'Alleen open aanvragen kunnen worden verwijderd' }, { status: 400 })
    }

    const { error } = await supabase
      .from('zorgvragen')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Zorgvraag verwijderen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
