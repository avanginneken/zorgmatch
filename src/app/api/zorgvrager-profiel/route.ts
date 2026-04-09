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
  try {
    const supabase = await createClient()
    const gebruiker = await getGebruiker(supabase)

    // Demo-sessie: geef leeg profiel terug zodat de pagina laadt
    if (!gebruiker) {
      if (await isDemoZorgvrager()) {
        return NextResponse.json({ profiel: null })
      }
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    if (gebruiker.rol !== 'ZORGVRAGER') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('zorgvrager_profielen')
      .select('*')
      .eq('gebruiker_id', gebruiker.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found

    return NextResponse.json({ profiel: data ?? null })
  } catch (error) {
    console.error('Profiel ophalen fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const gebruiker = await getGebruiker(supabase)

    // Demo-sessie: doe alsof opslaan werkt maar schrijf niets
    if (!gebruiker) {
      if (await isDemoZorgvrager()) {
        const body = await request.json()
        return NextResponse.json({ profiel: body })
      }
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    if (gebruiker.rol !== 'ZORGVRAGER') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const body = await request.json()

    // Toegestane velden — geen vrije SQL-injectie mogelijk
    const toegestaneVelden = [
      'huisdieren_aanwezig', 'huisdier_type',
      'allergieen', 'medische_aandachtspunten', 'mobiliteit',
      'reanimatie', 'dnr_aanwezig',
      'noodmedicatie_aanwezig', 'noodmedicatie_toelichting',
      'noodcontact_naam', 'noodcontact_telefoon',
      'toegang_methode', 'toegang_toelichting',
    ]

    const updates: Record<string, unknown> = {}
    for (const veld of toegestaneVelden) {
      if (veld in body) updates[veld] = body[veld]
    }

    // Upsert: aanmaken als niet bestaat, bijwerken als wel bestaat
    const { data, error } = await supabase
      .from('zorgvrager_profielen')
      .upsert(
        { gebruiker_id: gebruiker.id, ...updates },
        { onConflict: 'gebruiker_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profiel: data })
  } catch (error) {
    console.error('Profiel opslaan fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
