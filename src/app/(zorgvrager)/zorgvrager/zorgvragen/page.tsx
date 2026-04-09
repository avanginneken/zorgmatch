'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FileText, Plus, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react'

const statusConfig = {
  OPEN: { label: 'Open', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  GEKOPPELD: { label: 'Gekoppeld', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
  AFGEROND: { label: 'Afgerond', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle },
  GEANNULEERD: { label: 'Geannuleerd', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: XCircle },
}

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

export default function ZorgvragenPage() {
  const [zorgvragen, setZorgvragen] = useState<any[]>([])
  const [laden, setLaden] = useState(true)
  const [verwijderenId, setVerwijderenId] = useState<string | null>(null)
  const [bevestigId, setBevestigId] = useState<string | null>(null)

  const laadZorgvragen = useCallback(async () => {
    try {
      const res = await fetch('/api/zorgvragen/lijst')
      if (res.ok) {
        const data = await res.json()
        setZorgvragen(data.zorgvragen || [])
      }
    } finally {
      setLaden(false)
    }
  }, [])

  useEffect(() => {
    laadZorgvragen()
  }, [laadZorgvragen])

  const verwijder = async (id: string) => {
    setVerwijderenId(id)
    try {
      const res = await fetch(`/api/zorgvragen?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setZorgvragen(prev => prev.filter(z => z.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Verwijderen mislukt')
      }
    } finally {
      setVerwijderenId(null)
      setBevestigId(null)
    }
  }

  if (laden) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijn zorgaanvragen</h1>
          <p className="text-gray-600 mt-1">Overzicht van al uw ingediende zorgaanvragen</p>
        </div>
        <Link
          href="/zorgvrager/zorgvraag/nieuw"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe aanvraag
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {zorgvragen.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-1">Nog geen zorgaanvragen</h3>
            <p className="text-sm text-gray-500 mb-5">Dien uw eerste aanvraag in en wij koppelen u snel aan een zorgverlener</p>
            <Link
              href="/zorgvrager/zorgvraag/nieuw"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aanvraag indienen
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Zorgtype / Omschrijving</span>
              <span>Locatie</span>
              <span>Datum</span>
              <span>Status</span>
              <span></span>
            </div>
            <div className="divide-y divide-gray-50">
              {zorgvragen.map((z: any) => {
                const status = statusConfig[z.status as keyof typeof statusConfig]
                const StatusIcon = status?.icon || Clock
                const kanVerwijderen = z.status === 'OPEN'

                return (
                  <div key={z.id} className="px-5 py-4 grid grid-cols-6 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2">
                      <p className="font-medium text-sm text-gray-900">
                        {zorgtypeLabels[z.zorgtype] || z.zorgtype}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{z.omschrijving}</p>
                    </div>
                    <span className="text-sm text-gray-600">{z.stad}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(z.aangemaakt_op).toLocaleDateString('nl-NL')}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border w-fit ${status?.color || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status?.label || z.status}
                    </span>
                    <div className="flex justify-end">
                      {kanVerwijderen && (
                        bevestigId === z.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => verwijder(z.id)}
                              disabled={verwijderenId === z.id}
                              className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {verwijderenId === z.id ? '...' : 'Ja, verwijder'}
                            </button>
                            <button
                              onClick={() => setBevestigId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Annuleer
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBevestigId(z.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Aanvraag verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
