// Demo-modus: werkt zonder Supabase-configuratie

export const DEMO_ACCOUNTS = [
  { email: 'beheer@zorgmatch.nl', password: 'Demo1234!', rol: 'BEHEER', naam: 'Admin Beheer' },
  { email: 'vrager@test.nl',      password: 'Demo1234!', rol: 'ZORGVRAGER', naam: 'Maria de Vries' },
  { email: 'verlener@test.nl',    password: 'Demo1234!', rol: 'ZORGVERLENER', naam: 'Jan Verpleging' },
]

export const DEMO_COOKIE = 'zorgmatch_demo'

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url'
}

export function getDemoSession(): { rol: string; naam: string } | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`${DEMO_COOKIE}=([^;]+)`))
  if (!match) return null
  try { return JSON.parse(decodeURIComponent(match[1])) } catch { return null }
}

export function setDemoSession(rol: string, naam: string) {
  const value = encodeURIComponent(JSON.stringify({ rol, naam }))
  document.cookie = `${DEMO_COOKIE}=${value}; path=/; max-age=86400`
}

export function clearDemoSession() {
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`
}
