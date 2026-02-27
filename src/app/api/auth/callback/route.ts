import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user role for redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: gebruiker } = await supabase
          .from('gebruikers')
          .select('rol')
          .eq('auth_id', user.id)
          .single()

        if (gebruiker) {
          if (gebruiker.rol === 'BEHEER') return NextResponse.redirect(`${origin}/beheer/dashboard`)
          if (gebruiker.rol === 'ZORGVERLENER') return NextResponse.redirect(`${origin}/zorgverlener/dashboard`)
          return NextResponse.redirect(`${origin}/zorgvrager/dashboard`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/inloggen?error=auth`)
}
