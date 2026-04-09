'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export function AfrondButton({ matchId }: { matchId: string }) {
  const [bezig, setBezig] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const router = useRouter()

  const afronden = async () => {
    setBezig(true)
    try {
      await fetch('/api/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, actie: 'afronden' }),
      })
      router.push(`/zorgverlener/reviews/${matchId}`)
    } finally {
      setBezig(false)
      setBevestig(false)
    }
  }

  if (bevestig) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Opdracht afronden?</span>
        <button
          onClick={afronden}
          disabled={bezig}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {bezig ? 'Bezig...' : 'Ja, afronden'}
        </button>
        <button
          onClick={() => setBevestig(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
        >
          Annuleren
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setBevestig(true)}
      className="flex items-center gap-1.5 text-xs border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      Opdracht afronden
    </button>
  )
}
