'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { FileText, Search, ChevronUp, ChevronDown, ChevronsUpDown, UserPlus, X, CheckCircle, Loader2 } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'text-amber-700 bg-amber-50' },
  GEKOPPELD: { label: 'Gekoppeld', color: 'text-green-700 bg-green-50' },
  AFGEROND: { label: 'Afgerond', color: 'text-blue-700 bg-blue-50' },
  GEANNULEERD: { label: 'Geannuleerd', color: 'text-gray-700 bg-gray-100' },
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

type SortKey = 'zorgtype' | 'stad' | 'indicatiebedrag' | 'aangemaakt_op' | 'status'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

interface Zorgverlener {
  id: string
  naam: string
  stad?: string
  zorgtypes?: string[]
  uurtarief?: number
}

interface Props {
  zorgvragen: any[]
  isAdmin?: boolean
}

function ToewrijzenModal({
  zorgvraag,
  onClose,
  onSuccess,
}: {
  zorgvraag: any
  onClose: () => void
  onSuccess: (zorgvraagId: string) => void
}) {
  const [verleners, setVerleners] = useState<Zorgverlener[]>([])
  const [laden, setLaden] = useState(true)
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    fetch('/api/beheer/zorgverleners')
      .then(r => r.json())
      .then(data => setVerleners(data.zorgverleners || []))
      .finally(() => setLaden(false))
  }, [])

  const wijs = async () => {
    if (!geselecteerd) return
    setBezig(true)
    setFout('')
    try {
      const res = await fetch('/api/beheer/toewijzen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zorgvraagId: zorgvraag.id,
          zorgverlenerGebruikerId: geselecteerd,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFout(data.error || 'Toewijzen mislukt')
      } else {
        setSucces(true)
        setTimeout(() => {
          onSuccess(zorgvraag.id)
          onClose()
        }, 1200)
      }
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Zorgverlener toewijzen</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {zorgtypeLabels[zorgvraag.zorgtype] || zorgvraag.zorgtype} · {zorgvraag.stad}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Inhoud */}
        <div className="p-5">
          {succes ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Succesvol toegewezen!</p>
            </div>
          ) : laden ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Zorgverleners laden...</span>
            </div>
          ) : verleners.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Geen goedgekeurde zorgverleners beschikbaar
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {verleners.map(v => (
                <label
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    geselecteerd === v.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="verlener"
                    checked={geselecteerd === v.id}
                    onChange={() => setGeselecteerd(v.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{v.naam}</p>
                    <p className="text-xs text-gray-500">
                      {v.stad}{v.uurtarief ? ` · €${v.uurtarief}/uur` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {fout && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {fout}
            </p>
          )}
        </div>

        {/* Footer */}
        {!succes && (
          <div className="flex justify-end gap-3 px-5 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={wijs}
              disabled={!geselecteerd || bezig}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {bezig ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Toewijzen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ZorgvragenTable({ zorgvragen: initialZorgvragen, isAdmin = false }: Props) {
  const [zorgvragen, setZorgvragen] = useState(initialZorgvragen)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'aangemaakt_op', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [toewrijzenZorgvraag, setToewrijzenZorgvraag] = useState<any | null>(null)

  // Sync als parent data verandert
  useEffect(() => { setZorgvragen(initialZorgvragen) }, [initialZorgvragen])

  const handleToewrijzenSucces = useCallback((zorgvraagId: string) => {
    setZorgvragen(prev => prev.map(z =>
      z.id === zorgvraagId ? { ...z, status: 'GEKOPPELD' } : z
    ))
  }, [])

  const filtered = useMemo(() => {
    let data = zorgvragen
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(z =>
        z.zorgtype?.toLowerCase().includes(q) ||
        z.stad?.toLowerCase().includes(q) ||
        z.zorgvrager?.naam?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'ALL') {
      data = data.filter(z => z.status === statusFilter)
    }
    data = [...data].sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      return sort.dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
    return data
  }, [zorgvragen, search, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const cols = isAdmin ? 7 : 6

  return (
    <>
      {toewrijzenZorgvraag && (
        <ToewrijzenModal
          zorgvraag={toewrijzenZorgvraag}
          onClose={() => setToewrijzenZorgvraag(null)}
          onSuccess={handleToewrijzenSucces}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoeken op type, stad of naam..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          >
            <option value="ALL">Alle statussen</option>
            <option value="OPEN">Open</option>
            <option value="GEKOPPELD">Gekoppeld</option>
            <option value="AFGEROND">Afgerond</option>
            <option value="GEANNULEERD">Geannuleerd</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultaten</span>
        </div>

        {/* Header */}
        <div className={`hidden md:grid grid-cols-${cols} px-5 py-3 bg-gray-50 border-b border-gray-100 gap-2`}
          style={{ gridTemplateColumns: isAdmin ? '2fr 1fr 1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr' }}>
          {([
            { key: 'zorgtype', label: 'Zorgtype' },
            { key: 'stad', label: 'Stad' },
            { key: 'indicatiebedrag', label: 'Indicatie' },
            { key: 'aangemaakt_op', label: 'Datum' },
            { key: 'status', label: 'Status' },
          ] as { key: SortKey; label: string }[]).map(col => (
            <button
              key={col.key}
              onClick={() => toggleSort(col.key)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors text-left"
            >
              {col.label}
              <SortIcon k={col.key} />
            </button>
          ))}
          {isAdmin && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actie</span>}
        </div>

        {/* Rows */}
        {pageData.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Geen zorgvragen gevonden</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pageData.map((z: any) => {
              const st = statusConfig[z.status] || { label: z.status, color: 'bg-gray-100 text-gray-700' }
              return (
                <div
                  key={z.id}
                  className="px-5 py-3.5 items-center hover:bg-gray-50 transition-colors gap-2 grid"
                  style={{ gridTemplateColumns: isAdmin ? '2fr 1fr 1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr' }}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{zorgtypeLabels[z.zorgtype] || z.zorgtype}</p>
                    <p className="text-xs text-gray-500">{z.zorgvrager?.naam}</p>
                  </div>
                  <span className="text-sm text-gray-600">{z.stad}</span>
                  <span className="text-sm text-gray-600">€{z.indicatiebedrag}/uur</span>
                  <span className="text-xs text-gray-500">{new Date(z.aangemaakt_op).toLocaleDateString('nl-NL')}</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${st.color}`}>
                    {st.label}
                  </span>
                  {isAdmin && (
                    <div>
                      {z.status === 'OPEN' ? (
                        <button
                          onClick={() => setToewrijzenZorgvraag(z)}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Toewijzen
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}
