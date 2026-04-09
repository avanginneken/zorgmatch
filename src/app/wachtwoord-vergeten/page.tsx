'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [verzonden, setVerzonden] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profiel/wachtwoord-reset`,
      })

      if (err) {
        setError('Er is een fout opgetreden. Controleer het e-mailadres en probeer opnieuw.')
      } else {
        setVerzonden(true)
      }
    } catch {
      setError('Verbinding mislukt. Probeer het later opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {verzonden ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">E-mail verzonden</h1>
              <p className="text-sm text-gray-600">
                Als <span className="font-medium">{email}</span> bekend is in ons systeem,
                ontvangt u een e-mail met een link om uw wachtwoord opnieuw in te stellen.
              </p>
              <p className="text-xs text-gray-400">
                Geen e-mail ontvangen? Controleer uw spam-map of probeer opnieuw.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => { setVerzonden(false); setEmail('') }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Opnieuw proberen
                </button>
                <Link href="/inloggen" className="text-sm text-gray-500 hover:underline">
                  Terug naar inloggen
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link
                  href="/inloggen"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar inloggen
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Wachtwoord vergeten</h1>
                <p className="text-gray-600 mt-1 text-sm">
                  Voer uw e-mailadres in. Als het bekend is sturen wij u een herstelmail.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="naam@voorbeeld.nl"
                      required
                      className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verzenden...' : 'Herstelmail versturen'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
