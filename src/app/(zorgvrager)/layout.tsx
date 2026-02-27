import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DEMO_COOKIE } from '@/lib/demo'

function isSupabaseConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
}

export default async function ZorgvragerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Demo mode: check cookie when Supabase is not configured
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE)
    if (!demoCookie) redirect('/inloggen')
    try {
      const session = JSON.parse(decodeURIComponent(demoCookie.value))
      if (session.rol !== 'ZORGVRAGER') redirect('/inloggen')
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar rol="ZORGVRAGER" naam={session.naam} />
          <div className="flex">
            <Sidebar rol="ZORGVRAGER" />
            <main className="flex-1 p-6 min-w-0 max-w-5xl"><Breadcrumb />{children}</main>
          </div>
        </div>
      )
    } catch {
      redirect('/inloggen')
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/inloggen')
  }

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('naam, rol')
    .eq('auth_id', user.id)
    .single()

  if (!gebruiker || gebruiker.rol !== 'ZORGVRAGER') {
    redirect('/inloggen')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol="ZORGVRAGER" naam={gebruiker.naam} />
      <div className="flex">
        <Sidebar rol="ZORGVRAGER" />
        <main className="flex-1 p-6 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  )
}
