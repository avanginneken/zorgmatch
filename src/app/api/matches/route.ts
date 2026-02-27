import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await request.json()
    const { zorgvraag_id, reactie_tekst } = body

    if (!zorgvraag_id) {
      return NextResponse.json({ error: 'zorgvraag_id is verplicht' }, { status: 400 })
    }

    // Get zorgverlener ID
    const { data: gebruiker } = await supabase
      .from('gebruikers')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    if (!gebruiker || gebruiker.rol !== 'ZORGVERLENER') {
      return NextResponse.json({ error: 'Alleen zorgverleners kunnen reageren' }, { status: 403 })
    }

    // Check zorgverlener is approved
    const { data: profiel } = await supabase
      .from('zorgverlener_profielen')
      .select('goedgekeurd')
      .eq('gebruiker_id', gebruiker.id)
      .single()

    if (!profiel?.goedgekeurd) {
      return NextResponse.json({ error: 'Uw account is nog niet goedgekeurd' }, { status: 403 })
    }

    // Check zorgvraag exists and is open
    const { data: zorgvraag } = await supabase
      .from('zorgvragen')
      .select('id, status, zorgvrager_id')
      .eq('id', zorgvraag_id)
      .single()

    if (!zorgvraag || zorgvraag.status !== 'OPEN') {
      return NextResponse.json({ error: 'Zorgvraag niet beschikbaar' }, { status: 400 })
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        zorgvraag_id,
        zorgverlener_id: gebruiker.id,
        status: 'VOORGESTELD',
        reactie_tekst,
      })
      .select()
      .single()

    if (matchError) {
      if (matchError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'U heeft al gereageerd op deze aanvraag' }, { status: 409 })
      }
      throw matchError
    }

    // Notify zorgvrager
    await supabase.from('notificaties').insert({
      gebruiker_id: zorgvraag.zorgvrager_id,
      type: 'ZORGVERLENER_GEREAGEERD',
      titel: 'Een zorgverlener heeft gereageerd!',
      bericht: 'Er is een reactie op uw zorgaanvraag. Bekijk het profiel van de zorgverlener.',
      data: { match_id: match.id, zorgvraag_id },
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('Match aanmaken fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await request.json()
    const { match_id, actie } = body // actie: 'bevestigen' | 'afwijzen'

    const { data: gebruiker } = await supabase
      .from('gebruikers')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    // Get match
    const { data: match } = await supabase
      .from('matches')
      .select(`
        id, status, zorgverlener_id,
        zorgvraag:zorgvragen (id, zorgvrager_id, indicatiebedrag)
      `)
      .eq('id', match_id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match niet gevonden' }, { status: 404 })
    }

    // Only zorgvrager can confirm/reject matches for their own request
    const zorgvraag = match.zorgvraag as any
    if (gebruiker?.id !== zorgvraag.zorgvrager_id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    if (actie === 'bevestigen') {
      // Confirm this match
      await supabase
        .from('matches')
        .update({ status: 'BEVESTIGD', bevestigd_op: new Date().toISOString() })
        .eq('id', match_id)

      // Update zorgvraag status
      await supabase
        .from('zorgvragen')
        .update({ status: 'GEKOPPELD' })
        .eq('id', zorgvraag.id)

      // Cancel other pending matches for this zorgvraag
      await supabase
        .from('matches')
        .delete()
        .eq('zorgvraag_id', zorgvraag.id)
        .neq('id', match_id)

      // Notify zorgverlener
      await supabase.from('notificaties').insert({
        gebruiker_id: match.zorgverlener_id,
        type: 'MATCH_BEVESTIGD',
        titel: 'Match bevestigd!',
        bericht: 'Gefeliciteerd! Uw aanbieding is geaccepteerd. U kunt contact opnemen met de zorgvrager.',
        data: { match_id },
      })

      // Create payment record
      const commissie = Number(zorgvraag.indicatiebedrag) * 0.10
      await supabase.from('betalingen').insert({
        match_id,
        bedrag: zorgvraag.indicatiebedrag,
        commissie,
        status: 'OPEN',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Match bijwerken fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
