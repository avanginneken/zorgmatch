'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, EyeOff } from 'lucide-react'

export function BeheerReviewActies({
  reviewId,
  toonGoedkeuren = true,
}: {
  reviewId: string
  toonGoedkeuren?: boolean
}) {
  const [bezig, setBezig] = useState(false)
  const router = useRouter()

  const actie = async (type: 'goedkeuren' | 'verbergen') => {
    setBezig(true)
    try {
      await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actie: type }),
      })
      router.refresh()
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {toonGoedkeuren && (
        <button
          onClick={() => actie('goedkeuren')}
          disabled={bezig}
          className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Goedkeuren
        </button>
      )}
      <button
        onClick={() => actie('verbergen')}
        disabled={bezig}
        className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <EyeOff className="w-3.5 h-3.5" />
        Verbergen
      </button>
    </div>
  )
}
