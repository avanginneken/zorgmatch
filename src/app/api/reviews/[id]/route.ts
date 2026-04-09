import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const gebruiker = await getGebruiker(supabase)
    if (!gebruiker) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { actie, reden, besluit } = body

    const { data: review } = await supabase
      .from('reviews')
      .select('id, status, reviewer_id, reviewee_id')
      .eq('id', id)
      .single()

    if (!review) return NextResponse.json({ error: 'Review niet gevonden' }, { status: 404 })

    // Melden (door betrokkene)
    if (actie === 'melden') {
      if (review.reviewee_id !== gebruiker.id && review.reviewer_id !== gebruiker.id) {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }
      if (review.status !== 'ZICHTBAAR') {
        return NextResponse.json({ error: 'Review kan niet worden gemeld' }, { status: 400 })
      }
      await supabase
        .from('reviews')
        .update({
          status: 'GEMELD',
          gemeld_door: gebruiker.id,
          gemeld_op: new Date().toISOString(),
          gemeld_reden: reden || null,
        })
        .eq('id', id)

      return NextResponse.json({ success: true })
    }

    // Beheer: goedkeuren of verbergen
    if (actie === 'goedkeuren' || actie === 'verbergen') {
      if (gebruiker.rol !== 'BEHEER') {
        return NextResponse.json({ error: 'Alleen beheer mag modereren' }, { status: 403 })
      }
      const nieuweStatus = actie === 'goedkeuren' ? 'ZICHTBAAR' : 'VERBORGEN'
      await supabase
        .from('reviews')
        .update({
          status: nieuweStatus,
          beheer_besluit: besluit || null,
          beheer_besluit_op: new Date().toISOString(),
          beheer_besluit_door: gebruiker.id,
        })
        .eq('id', id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
  } catch (error) {
    console.error('Review bijwerken fout:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
