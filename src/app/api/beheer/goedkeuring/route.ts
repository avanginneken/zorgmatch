import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE } from '@/lib/demo'
import { createClient as createServerClient } from '@/lib/supabase/server'

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
  } catch {
    return false
  }
}

// UUID v4 regex
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest) {
  if (!(await isBeheer())) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  const body = await request.json()
  const { profielId, actie, reden } = body

  if (!profielId || !actie) {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }

  // Demo-IDs zijn geen echte UUIDs — simuleer succes zonder DB-aanroep
  if (!UUID_RE.test(profielId)) {
    return NextResponse.json({ success: true, demo: true })
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    if (actie === 'goedkeuren') {
      const { error } = await supabase
        .from('zorgverlener_profielen')
        .update({
          goedgekeurd: true,
          goedgekeurd_op: new Date().toISOString(),
          document_status: 'GOEDGEKEURD',
        })
        .eq('id', profielId)

      if (error) throw error

      // Stuur notificatie naar zorgverlener
      const { data: profiel } = await supabase
        .from('zorgverlener_profielen')
        .select('gebruiker_id')
        .eq('id', profielId)
        .maybeSingle()

      if (profiel?.gebruiker_id) {
        await supabase.from('notificaties').insert({
          gebruiker_id: profiel.gebruiker_id,
          type: 'ACCOUNT_GOEDGEKEURD',
          titel: 'Uw account is goedgekeurd!',
          bericht: 'Gefeliciteerd! Uw ZorgMatch account is goedgekeurd. U kunt nu zorgvragen ontvangen.',
        })
      }

      return NextResponse.json({ success: true })

    } else if (actie === 'afkeuren') {
      if (!reden) {
        return NextResponse.json({ error: 'Reden verplicht' }, { status: 400 })
      }

      const { data: profiel } = await supabase
        .from('zorgverlener_profielen')
        .select('gebruiker_id')
        .eq('id', profielId)
        .maybeSingle()

      const { error } = await supabase
        .from('zorgverlener_profielen')
        .update({
          document_status: 'AFGEKEURD',
          afwijzing_reden: reden,
        })
        .eq('id', profielId)

      if (error) throw error

      if (profiel?.gebruiker_id) {
        await supabase.from('notificaties').insert({
          gebruiker_id: profiel.gebruiker_id,
          type: 'ACCOUNT_AFGEKEURD',
          titel: 'Aanvraag niet goedgekeurd',
          bericht: `Uw aanvraag is helaas niet goedgekeurd. Reden: ${reden}`,
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
  } catch (error) {
    console.error('Goedkeuring fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
