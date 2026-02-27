'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Eye, EyeOff, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_ACCOUNTS, setDemoSession } from '@/lib/demo'

export default function InloggenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoSession(account.rol, account.naam)
    if (account.rol === 'BEHEER') {
      router.push('/beheer/dashboard')
    } else if (account.rol === 'ZORGVERLENER') {
      router.push('/zorgverlener/dashboard')
    } else {
      router.push('/zorgvrager/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check demo accounts first (works without Supabase)
    const demoAccount = DEMO_ACCOUNTS.find(
      a => a.email === form.email && a.password === form.password
    )
    if (demoAccount) {
      handleDemoLogin(demoAccount)
      return
    }

    if (!isSupabaseConfigured) {
      setError('Onjuist e-mailadres of wachtwoord')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError('Onjuist e-mailadres of wachtwoord')
        return
      }

      const { data: gebruiker } = await supabase
        .from('gebruikers')
        .select('rol')
        .eq('auth_id', data.user.id)
        .single()

      if (!gebruiker) {
        setError('Account niet gevonden. Meld u opnieuw aan.')
        return
      }

      if (gebruiker.rol === 'BEHEER') {
        router.push('/beheer/dashboard')
      } else if (gebruiker.rol === 'ZORGVERLENER') {
        router.push('/zorgverlener/dashboard')
      } else {
        router.push('/zorgvrager/dashboard')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Zorg<span className="text-blue-600">Match</span></span>
          </Link>
          <Link href="/aanmelden" className="text-sm text-gray-600 hover:text-gray-900">
            Nog geen account? <span className="text-blue-600 font-medium">Aanmelden</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welkom terug</h1>
            <p className="text-gray-600 mb-6">Log in op uw ZorgMatch account</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jan@voorbeeld.nl"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Wachtwoord</label>
                  <Link href="/wachtwoord-vergeten" className="text-xs text-blue-600 hover:underline">
                    Vergeten?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inloggen...' : 'Inloggen'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Nog geen account?{' '}
                <Link href="/aanmelden" className="text-blue-600 font-medium hover:underline">
                  Gratis aanmelden
                </Link>
              </p>
            </div>
          </div>

          {/* Demo accounts — klik om direct in te loggen */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-medium text-blue-900 mb-3 text-sm flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Demo — klik om direct in te loggen
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${
                    account.rol === 'BEHEER'
                      ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800'
                      : account.rol === 'ZORGVERLENER'
                      ? 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-800'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800'
                  }`}
                >
                  <span className="text-lg">
                    {account.rol === 'BEHEER' ? '⚙️' : account.rol === 'ZORGVERLENER' ? '🩺' : '💙'}
                  </span>
                  <div>
                    <div className="font-medium">{account.naam}</div>
                    <div className="text-xs opacity-70">{account.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
