'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Send, CheckCircle } from 'lucide-react'

const SCORES_CONFIG = [
  { key: 'professionaliteit', label: 'Professionaliteit', omschrijving: 'Vakkundige en professionele werkwijze' },
  { key: 'communicatie', label: 'Communicatie', omschrijving: 'Duidelijk en tijdig contact' },
  { key: 'punctualiteit', label: 'Punctualiteit', omschrijving: 'Op tijd en betrouwbaar' },
  { key: 'vertrouwen', label: 'Gevoel van vertrouwen', omschrijving: 'Veilig gevoel bij de zorgverlener' },
]

function StarsInput({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${
              n <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ZorgvragerReviewPage() {
  const { match_id } = useParams<{ match_id: string }>()
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [ingediend, setIngediend] = useState(false)
  const [fout, setFout] = useState('')

  const alleIngevuld = SCORES_CONFIG.every(s => (scores[s.key] ?? 0) >= 1)
  const gemiddelde = alleIngevuld
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / SCORES_CONFIG.length).toFixed(1)
    : null

  const indienen = async () => {
    if (!alleIngevuld) { setFout('Vul alle beoordelingen in'); return }
    setBezig(true); setFout('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id, scores, tekst }),
      })
      if (res.ok) {
        setIngediend(true)
      } else {
        const data = await res.json()
        setFout(data.error || 'Er is een fout opgetreden')
      }
    } finally {
      setBezig(false)
    }
  }

  if (ingediend) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Beoordeling ingediend!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Uw beoordeling is ontvangen. De zorgverlener kan deze pas zien nadat ook zij een beoordeling hebben ingediend.
          </p>
          <button
            onClick={() => router.push('/zorgvrager/dashboard')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Terug naar dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beoordeel uw zorgverlener</h1>
        <p className="text-gray-500 text-sm mt-1">
          Uw beoordeling wordt pas zichtbaar nadat beide partijen hebben beoordeeld.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {SCORES_CONFIG.map(item => (
          <div key={item.key}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.omschrijving}</p>
              </div>
              {scores[item.key] > 0 && (
                <span className="text-sm font-semibold text-amber-600 whitespace-nowrap">
                  {scores[item.key]}/5
                </span>
              )}
            </div>
            <StarsInput
              value={scores[item.key] ?? 0}
              onChange={n => setScores(prev => ({ ...prev, [item.key]: n }))}
            />
          </div>
        ))}

        {gemiddelde && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-700">
              Gemiddeld: <span className="font-semibold">{gemiddelde}</span> / 5
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Toelichting <span className="text-gray-400 font-normal">(optioneel)</span>
        </label>
        <textarea
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Beschrijf uw ervaring met de zorgverlener..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{tekst.length}/1000</p>
      </div>

      {fout && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {fout}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={indienen}
          disabled={bezig || !alleIngevuld}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {bezig ? 'Indienen...' : 'Beoordeling indienen'}
        </button>
      </div>
    </div>
  )
}
