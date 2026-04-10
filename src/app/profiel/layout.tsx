import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DEMO_COOKIE } from '@/lib/demo'

export default async function ProfielLayout({ children }: { children: React.ReactNode }) {
  // Controleer demo-cookie eerst — werkt ongeacht Supabase-configuratie
  const cookieStore = await cookies()
  const demoCookie = cookieStore.get(DEMO_COOKIE)

  if (demoCookie?.value) {
    try {
      const session = JSON.parse(decodeURIComponent(demoCookie.value))
      const rol = session.rol as 'ZORGVRAGER' | 'ZORGVERLENER' | 'BEHEER'
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar rol={rol} naam={session.naam} />
          <div className="flex">
            <Sidebar rol={rol} />
            <main className="flex-1 p-6 min-w-0 max-w-3xl">
              <Breadcrumb />
              {children}
            </main>
          </div>
        </div>
      )
    } catch {
      redirect('/inloggen')
    }
  }

  // Geen demo-cookie → echte Supabase-sessie vereist
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/inloggen')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('naam, rol')
    .eq('auth_id', user.id)
    .single()

  if (!gebruiker) redirect('/inloggen')

  const rol = gebruiker.rol as 'ZORGVRAGER' | 'ZORGVERLENER' | 'BEHEER'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol={rol} naam={gebruiker.naam} />
      <div className="flex">
        <Sidebar rol={rol} />
        <main className="flex-1 p-6 min-w-0 max-w-3xl">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  )
}
