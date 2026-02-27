'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, Euro, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const zorgtypeLabels: Record<string, string> = {
  persoonlijke_verzorging: 'Persoonlijke verzorging',
  verpleging: 'Verpleging',
  begeleiding: 'Begeleiding',
  huishoudelijke_hulp: 'Huishoudelijke hulp',
  dagbesteding: 'Dagbesteding',
  nachtzorg: 'Nachtzorg',
  respijtzorg: 'Respijtzorg',
  geestelijke_gezondheidszorg: 'GGZ begeleiding',
}

interface Props {
  zorgvraag: {
    id: string
    zorgtype: string
    omschrijving: string
    indicatiebedrag: number
    uren_per_week?: number
    startdatum?: string
    status: string
    stad: string
    adres?: string
    aangemaakt_op: string
    zorgvrager?: { naam: string; stad: string }
  }
  bestaandeMatch?: { id: string; status: string } | null
}

export function ReagerenClient({ zorgvraag, bestaandeMatch }: Props) {
  const router = useRouter()
  const [reactie, setReactie] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleReageer = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zorgvraag_id: zorgvraag.id,
          reactie_tekst: reactie,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Er ging iets mis')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/zorgverlener/opdrachten'), 2000)
    } catch (err) {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">Reactie verstuurd!</h2>
          <p className="text-green-700">De zorgvrager ontvangt een melding en neemt contact op als er een match is.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/zorgverlener/opdrachten" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Terug naar opdrachten
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Zorgvraag bekijken</h1>
      </div>

      {/* Zorgvraag detail */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {zorgtypeLabels[zorgvraag.zorgtype] || zorgvraag.zorgtype}
            </h2>
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
              Open
            </span>
          </div>
          <p className="text-gray-700">{zorgvraag.omschrijving}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            {zorgvraag.stad}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Euro className="w-4 h-4 text-gray-400" />
            €{zorgvraag.indicatiebedrag}/uur indicatie
          </div>
          {zorgvraag.uren_per_week && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              {zorgvraag.uren_per_week} uur/week
            </div>
          )}
          {zorgvraag.startdatum && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              Start: {new Date(zorgvraag.startdatum).toLocaleDateString('nl-NL')}
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          Geplaatst op {new Date(zorgvraag.aangemaakt_op).toLocaleDateString('nl-NL', {
            day: 'numeric', month: 'long', year: 'numeric'
          })} · Privacybescherming: naam van zorgvrager wordt pas gedeeld na bevestiging
        </div>
      </div>

      {/* Commissie info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-2">Vergoeding berekening</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Indicatietarief</span>
            <span>€{zorgvraag.indicatiebedrag}/uur</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>ZorgMatch commissie (10%)</span>
            <span>-€{(Number(zorgvraag.indicatiebedrag) * 0.10).toFixed(2)}/uur</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200 mt-1">
            <span>Uw vergoeding</span>
            <span>€{(Number(zorgvraag.indicatiebedrag) * 0.90).toFixed(2)}/uur</span>
          </div>
        </div>
      </div>

      {/* Reageer section */}
      {bestaandeMatch ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-medium text-amber-800">U heeft al gereageerd op deze aanvraag</p>
          <p className="text-sm text-amber-700 mt-1">
            Status: {bestaandeMatch.status === 'VOORGESTELD' ? 'In behandeling' : bestaandeMatch.status === 'BEVESTIGD' ? 'Bevestigd' : 'Afgerond'}
          </p>
        </div>
      ) : zorgvraag.status !== 'OPEN' ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-gray-600">
          Deze zorgvraag is niet meer beschikbaar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Reageer op deze aanvraag</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivatie (optioneel)
            </label>
            <textarea
              value={reactie}
              onChange={e => setReactie(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder="Vertel iets over uw ervaring met dit type zorg en waarom u geschikt bent..."
            />
          </div>

          <div className="flex gap-3">
            <Link
              href="/zorgverlener/opdrachten"
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Annuleren
            </Link>
            <button
              onClick={handleReageer}
              disabled={loading}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Versturen...' : 'Reageer op aanvraag'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            U reageert pas wanneer u op &quot;Reageer&quot; klikt. De zorgvrager beslist wie de opdracht krijgt.
          </p>
        </div>
      )}
    </div>
  )
}
