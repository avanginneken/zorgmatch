import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'

async function getGebruiker(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('gebruikers')
    .select('id, rol')
    .eq('auth_id', user.id)
    .single()
  return data
}

async function getDemoSession() {
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (!demoCookie) return null
    return JSON.parse(decodeURIComponent(demoCookie.value))
  } catch { return null }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const gebruiker = await getGebruiker(supabase)

    if (!gebruiker) {
      const demo = await getDemoSession()
      if (demo) return NextResponse.json({ review: { id: 'demo', status: 'INGEDIEND' } }, { status: 201 })
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await request.json()
    const { match_id, scores, tekst } = body

    if (!match_id || !scores) {
      return NextResponse.json({ error: 'match_id en scores zijn verplicht' }, { status: 400 })
    }

    // Haal match op
    const { data: match } = await supabase
      .from('matches')
      .select(`
        id, status, zorgverlener_id,
        zorgvraag:zorgvragen!matches_zorgvraag_id_fkey (zorgvrager_id)
      `)
      .eq('id', match_id)
      .single()

    if (!match || match.status !== 'AFGEROND') {
      return NextResponse.json({ error: 'Match niet gevonden of nog niet afgerond' }, { status: 400 })
    }

    const zorgvraag = match.zorgvraag as any

    // Bepaal wie de reviewee is
    let reviewee_id: string
    if (gebruiker.rol === 'ZORGVRAGER' && zorgvraag.zorgvrager_id === gebruiker.id) {
      reviewee_id = match.zorgverlener_id
    } else if (gebruiker.rol === 'ZORGVERLENER' && match.zorgverlener_id === gebruiker.id) {
      reviewee_id = zorgvraag.zorgvrager_id
    } else {
      return NextResponse.json({ error: 'Geen toegang tot deze match' }, { status: 403 })
    }

    // Score validatie (1-5)
    for (const [key, val] of Object.entries(scores)) {
      const n = Number(val)
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return NextResponse.json({ error: `Ongeldige score voor ${key}` }, { status: 400 })
      }
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        match_id,
        reviewer_id: gebruiker.id,
        reviewee_id,
        reviewer_rol: gebruiker.rol,
        scores,
        tekst: tekst?.trim() || null,
        status: 'INGEDIEND',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'U heeft al een review ingediend voor deze match' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Review indienen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const gebruiker = await getGebruiker(supabase)
    if (!gebruiker) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const match_id = searchParams.get('match_id')
    const reviewee_id = searchParams.get('reviewee_id')

    let query = supabase
      .from('reviews')
      .select(`*, reviewer:gebruikers!reviews_reviewer_id_fkey (naam)`)

    if (match_id) query = query.eq('match_id', match_id)
    if (reviewee_id) query = query.eq('reviewee_id', reviewee_id).eq('status', 'ZICHTBAAR')

    const { data } = await query.order('aangemaakt_op', { ascending: false })

    return NextResponse.json({ reviews: data || [] })
  } catch (error) {
    console.error('Reviews ophalen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
