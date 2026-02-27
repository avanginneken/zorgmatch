'use client'

import { useState, useMemo } from 'react'
import { FileText, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
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

interface Props {
  zorgvragen: any[]
}

export function ZorgvragenTable({ zorgvragen }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'aangemaakt_op', dir: 'desc' })
  const [page, setPage] = useState(1)

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

  return (
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
      <div className="hidden md:grid grid-cols-6 px-5 py-3 bg-gray-50 border-b border-gray-100 gap-2">
        {([
          { key: 'zorgtype', label: 'Zorgtype', span: 2 },
          { key: 'stad', label: 'Stad', span: 1 },
          { key: 'indicatiebedrag', label: 'Indicatie', span: 1 },
          { key: 'aangemaakt_op', label: 'Datum', span: 1 },
          { key: 'status', label: 'Status', span: 1 },
        ] as { key: SortKey; label: string; span: number }[]).map(col => (
          <button
            key={col.key}
            onClick={() => toggleSort(col.key)}
            className={`flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors text-left ${col.span === 2 ? 'col-span-2' : ''}`}
          >
            {col.label}
            <SortIcon k={col.key} />
          </button>
        ))}
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
              <div key={z.id} className="px-5 py-3.5 grid grid-cols-6 items-center hover:bg-gray-50 transition-colors gap-2">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">{zorgtypeLabels[z.zorgtype] || z.zorgtype}</p>
                  <p className="text-xs text-gray-500">{z.zorgvrager?.naam}</p>
                </div>
                <span className="text-sm text-gray-600">{z.stad}</span>
                <span className="text-sm text-gray-600">€{z.indicatiebedrag}/uur</span>
                <span className="text-xs text-gray-500">{new Date(z.aangemaakt_op).toLocaleDateString('nl-NL')}</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${st.color}`}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
