'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Star, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_ACCOUNTS, setDemoSession } from '@/lib/demo'

type UserType = 'zorgvrager' | 'zorgverlener'

function AanmeldenForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as UserType | null

  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType>(typeParam || 'zorgvrager')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    naam: '',
    email: '',
    telefoon: '',
    adres: '',
    stad: '',
    password: '',
    passwordConfirm: '',
    // Zorgverlener extra
    bigRegistratie: '',
    kvkNummer: '',
    zorgtypes: [] as string[],
    werkgebiedKm: '10',
    uurtarief: '',
    bio: '',
  })

  const zorgtypes = [
    { value: 'persoonlijke_verzorging', label: 'Persoonlijke verzorging' },
    { value: 'verpleging', label: 'Verpleging' },
    { value: 'begeleiding', label: 'Begeleiding' },
    { value: 'huishoudelijke_hulp', label: 'Huishoudelijke hulp' },
    { value: 'dagbesteding', label: 'Dagbesteding' },
    { value: 'nachtzorg', label: 'Nachtzorg' },
    { value: 'respijtzorg', label: 'Respijtzorg' },
    { value: 'geestelijke_gezondheidszorg', label: 'GGZ begeleiding' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleZorgtype = (value: string) => {
    setForm(prev => ({
      ...prev,
      zorgtypes: prev.zorgtypes.includes(value)
        ? prev.zorgtypes.filter(z => z !== value)
        : [...prev.zorgtypes, value]
    }))
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoSession(account.rol, account.naam)
    if (account.rol === 'BEHEER') router.push('/beheer/dashboard')
    else if (account.rol === 'ZORGVERLENER') router.push('/zorgverlener/dashboard')
    else router.push('/zorgvrager/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      setError('Registratie is momenteel niet beschikbaar. Gebruik een demo-account hieronder om de app te verkennen.')
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    if (form.password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            naam: form.naam,
            rol: userType === 'zorgverlener' ? 'ZORGVERLENER' : 'ZORGVRAGER',
          }
        }
      })

      if (authError) {
        console.error('Supabase auth fout:', JSON.stringify(authError))
        if (authError.message?.includes('Failed to fetch') || authError.message?.includes('fetch')) {
          setError('Verbinding met server mislukt. Controleer uw internetverbinding of probeer het later opnieuw.')
        } else if (authError.message?.includes('User already registered') || authError.message?.includes('already registered')) {
          setError('Dit e-mailadres is al geregistreerd. Ga naar inloggen.')
        } else if (authError.message?.includes('rate limit') || authError.status === 429) {
          setError('Te veel pogingen. Wacht even en probeer het opnieuw.')
        } else {
          setError(authError.message || 'Er is een fout opgetreden bij het aanmaken van uw account.')
        }
        return
      }

      if (!authData.user) {
        setError('Er ging iets mis bij het aanmaken van uw account')
        return
      }

      // Create gebruiker record
      const { error: gebruikerError } = await supabase
        .from('gebruikers')
        .insert({
          auth_id: authData.user.id,
          email: form.email,
          rol: userType === 'zorgverlener' ? 'ZORGVERLENER' : 'ZORGVRAGER',
          naam: form.naam,
          telefoon: form.telefoon,
          adres: form.adres,
          stad: form.stad,
        })

      if (gebruikerError) {
        console.error('Gebruiker aanmaken fout:', gebruikerError)
        setError('Er ging iets mis. Probeer het opnieuw.')
        return
      }

      // If zorgverlener, create profile
      if (userType === 'zorgverlener') {
        // Get the new gebruiker ID
        const { data: gebruiker } = await supabase
          .from('gebruikers')
          .select('id')
          .eq('auth_id', authData.user.id)
          .single()

        if (gebruiker) {
          await supabase.from('zorgverlener_profielen').insert({
            gebruiker_id: gebruiker.id,
            big_registratie: form.bigRegistratie,
            kvk_nummer: form.kvkNummer,
            zorgtypes: form.zorgtypes,
            werkgebied_km: parseInt(form.werkgebiedKm),
            uurtarief: form.uurtarief ? parseFloat(form.uurtarief) : null,
            bio: form.bio,
          })
        }
      }

      // Redirect to success or dashboard
      router.push('/aanmelden/bevestig?email=' + encodeURIComponent(form.email))

    } catch (err) {
      console.error(err)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Zorg<span className="text-blue-600">Match</span></span>
          </Link>
          <Link href="/inloggen" className="text-sm text-gray-600 hover:text-gray-900">
            Al een account? <span className="text-blue-600 font-medium">Inloggen</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account aanmaken</h1>
          <p className="text-gray-600 mb-6">Gratis aanmelden, geen verborgen kosten</p>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setUserType('zorgvrager')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                userType === 'zorgvrager'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Heart className={`w-5 h-5 mb-2 ${userType === 'zorgvrager' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="font-semibold text-sm">Ik zoek zorg</div>
              <div className="text-xs text-gray-500 mt-0.5">Zorgvrager</div>
            </button>
            <button
              type="button"
              onClick={() => setUserType('zorgverlener')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                userType === 'zorgverlener'
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Star className={`w-5 h-5 mb-2 ${userType === 'zorgverlener' ? 'text-teal-600' : 'text-gray-400'}`} />
              <div className="font-semibold text-sm">Ik bied zorg aan</div>
              <div className="text-xs text-gray-500 mt-0.5">Zorgverlener (zzp)</div>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basis gegevens */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volledige naam <span className="text-red-500">*</span>
                </label>
                <input
                  name="naam"
                  value={form.naam}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jan Jansen"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jan@voorbeeld.nl"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <input
                  name="telefoon"
                  type="tel"
                  value={form.telefoon}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="06-12345678"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stad / Woonplaats <span className="text-red-500">*</span>
                </label>
                <input
                  name="stad"
                  value={form.stad}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amsterdam"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <input
                  name="adres"
                  value={form.adres}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Straatnaam 1"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min. 8 tekens"
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
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord bevestigen <span className="text-red-500">*</span>
                </label>
                <input
                  name="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Herhaal wachtwoord"
                />
              </div>
            </div>

            {/* Zorgverlener extra velden */}
            {userType === 'zorgverlener' && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900">Professionele gegevens</h3>
                <p className="text-sm text-gray-600">
                  Na aanmelding kunt u uw documenten (BIG, VOG, diploma&apos;s) uploaden voor verificatie.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BIG-registratienummer</label>
                    <input
                      name="bigRegistratie"
                      value={form.bigRegistratie}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="BIG-nummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KvK-nummer</label>
                    <input
                      name="kvkNummer"
                      value={form.kvkNummer}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="KvK-nummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Werkgebied (km radius)</label>
                    <select
                      name="werkgebiedKm"
                      value={form.werkgebiedKm}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {['5', '10', '15', '20', '30', '50'].map(km => (
                        <option key={km} value={km}>{km} km</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uurtarief (€)</label>
                    <input
                      name="uurtarief"
                      type="number"
                      min="10"
                      max="200"
                      step="0.50"
                      value={form.uurtarief}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="35.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soorten zorg die u aanbiedt <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {zorgtypes.map(zt => (
                      <button
                        key={zt.value}
                        type="button"
                        onClick={() => toggleZorgtype(zt.value)}
                        className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                          form.zorgtypes.includes(zt.value)
                            ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {zt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Korte omschrijving</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Vertel iets over uw ervaring en specialisaties..."
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${userType === 'zorgverlener' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Even geduld...' : 'Account aanmaken'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Door aan te melden ga je akkoord met onze{' '}
              <Link href="/voorwaarden" className="text-blue-600 hover:underline">voorwaarden</Link>
              {' '}en{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">privacybeleid</Link>.
              Uw gegevens worden opgeslagen op EU-servers.
            </p>
          </form>
        </div>

        {/* Demo accounts sectie */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-900 mb-1 text-sm">🧪 Demo-modus — direct uitproberen</p>
          <p className="text-xs text-amber-700 mb-3">
            {isSupabaseConfigured
              ? 'Wil je de app eerst verkennen zonder te registreren? Log in met een demo-account.'
              : 'Registratie is niet beschikbaar in demo-modus. Log in met een van de demo-accounts.'}
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                type="button"
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
                  <div className="text-xs opacity-70">{account.rol.toLowerCase().replace('_', ' ')}</div>
                </div>
                <span className="ml-auto text-xs opacity-60 font-medium">Direct inloggen →</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function AanmeldenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Laden...</div>}>
      <AanmeldenForm />
    </Suspense>
  )
}
