import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'
import { createClient as createServerClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export async function POST(request: NextRequest) {
  if (!(await isBeheer())) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  const body = await request.json()
  const { zorgvraagId, zorgverlenerGebruikerId } = body

  if (!zorgvraagId || !zorgverlenerGebruikerId) {
    return NextResponse.json({ error: 'zorgvraagId en zorgverlenerGebruikerId zijn verplicht' }, { status: 400 })
  }

  // Demo: simuleer succes zonder DB
  if (!UUID_RE.test(zorgvraagId) || !UUID_RE.test(zorgverlenerGebruikerId)) {
    return NextResponse.json({ success: true, demo: true })
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Controleer zorgvraag
    const { data: zorgvraag } = await supabase
      .from('zorgvragen')
      .select('id, status, zorgvrager_id, indicatiebedrag')
      .eq('id', zorgvraagId)
      .maybeSingle()

    if (!zorgvraag) {
      return NextResponse.json({ error: 'Zorgvraag niet gevonden' }, { status: 404 })
    }
    if (zorgvraag.status !== 'OPEN') {
      return NextResponse.json({ error: 'Zorgvraag is niet meer open' }, { status: 400 })
    }

    // Maak match aan met status BEVESTIGD (admin-toewijzing)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        zorgvraag_id: zorgvraagId,
        zorgverlener_id: zorgverlenerGebruikerId,
        status: 'BEVESTIGD',
        bevestigd_op: new Date().toISOString(),
        reactie_tekst: 'Handmatig toegewezen door beheer',
      })
      .select()
      .maybeSingle()

    if (matchError) {
      if (matchError.code === '23505') {
        return NextResponse.json({ error: 'Deze zorgverlener is al gekoppeld aan deze aanvraag' }, { status: 409 })
      }
      throw matchError
    }

    // Update zorgvraag naar GEKOPPELD
    await supabase
      .from('zorgvragen')
      .update({ status: 'GEKOPPELD' })
      .eq('id', zorgvraagId)

    // Commissie vastleggen
    const commissie = Number(zorgvraag.indicatiebedrag) * 0.10
    await supabase.from('betalingen').insert({
      match_id: match?.id,
      bedrag: zorgvraag.indicatiebedrag,
      commissie,
      status: 'OPEN',
    })

    // Notificeer zorgverlener
    await supabase.from('notificaties').insert([
      {
        gebruiker_id: zorgverlenerGebruikerId,
        type: 'MATCH_BEVESTIGD',
        titel: 'U bent toegewezen aan een zorgvraag',
        bericht: 'Het beheerteam heeft u gekoppeld aan een nieuwe zorgvraag. Neem contact op met de zorgvrager.',
        data: { match_id: match?.id },
      },
      {
        gebruiker_id: zorgvraag.zorgvrager_id,
        type: 'MATCH_BEVESTIGD',
        titel: 'Er is een zorgverlener voor u gevonden',
        bericht: 'Het beheerteam heeft een zorgverlener voor u gevonden. U wordt binnenkort gecontacteerd.',
        data: { match_id: match?.id },
      },
    ])

    return NextResponse.json({ success: true, matchId: match?.id })
  } catch (error) {
    console.error('Toewijzen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
