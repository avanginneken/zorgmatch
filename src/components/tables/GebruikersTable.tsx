'use client'

import { useState, useMemo } from 'react'
import { Users, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'

const rolLabels: Record<string, { label: string; color: string }> = {
  ZORGVRAGER: { label: 'Zorgvrager', color: 'bg-blue-100 text-blue-700' },
  ZORGVERLENER: { label: 'Zorgverlener', color: 'bg-teal-100 text-teal-700' },
  BEHEER: { label: 'Beheer', color: 'bg-purple-100 text-purple-700' },
}

type SortKey = 'naam' | 'email' | 'rol' | 'stad' | 'aangemeld_op'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

interface Props {
  gebruikers: any[]
}

export function GebruikersTable({ gebruikers }: Props) {
  const [search, setSearch] = useState('')
  const [rolFilter, setRolFilter] = useState<string>('ALL')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'aangemeld_op', dir: 'desc' })
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let data = gebruikers
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(g =>
        g.naam?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.stad?.toLowerCase().includes(q)
      )
    }
    if (rolFilter !== 'ALL') {
      data = data.filter(g => g.rol === rolFilter)
    }
    data = [...data].sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      return sort.dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
    return data
  }, [gebruikers, search, rolFilter, sort])

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
            placeholder="Zoeken op naam, e-mail of stad..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select
          value={rolFilter}
          onChange={e => { setRolFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        >
          <option value="ALL">Alle rollen</option>
          <option value="ZORGVRAGER">Zorgvrager</option>
          <option value="ZORGVERLENER">Zorgverlener</option>
          <option value="BEHEER">Beheer</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultaten</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {([
                { key: 'naam', label: 'Naam' },
                { key: 'email', label: 'E-mail' },
                { key: 'rol', label: 'Rol' },
                { key: 'stad', label: 'Stad' },
                { key: 'aangemeld_op', label: 'Aangemeld' },
              ] as { key: SortKey; label: string }[]).map(col => (
                <th key={col.key} className="text-left px-5 py-3">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                  >
                    {col.label}
                    <SortIcon k={col.key} />
                  </button>
                </th>
              ))}
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Geen gebruikers gevonden</p>
                </td>
              </tr>
            ) : pageData.map((g: any) => {
              const rolConfig = rolLabels[g.rol] || { label: g.rol, color: 'bg-gray-100 text-gray-700' }
              const profiel = g.zorgverlener_profielen?.[0]
              return (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="font-medium text-sm text-gray-900">{g.naam}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{g.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolConfig.color}`}>
                      {rolConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{g.stad || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(g.aangemeld_op).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3">
                    {g.rol === 'ZORGVERLENER' && profiel ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        profiel.goedgekeurd ? 'bg-green-100 text-green-700'
                          : profiel.document_status === 'AFGEKEURD' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {profiel.goedgekeurd ? 'Actief' : profiel.document_status === 'AFGEKEURD' ? 'Afgekeurd' : 'In behandeling'}
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.actief ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {g.actief !== false ? 'Actief' : 'Inactief'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
