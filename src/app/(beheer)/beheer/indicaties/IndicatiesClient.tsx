'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Euro, Save } from 'lucide-react'

interface Tarief {
  id: string
  zorgtype: string
  min_bedrag: number
  max_bedrag: number
  standaard_bedrag: number
  commissie_percentage: number
  actief: boolean
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

export function IndicatiesClient({ tarieven }: { tarieven: Tarief[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [editValues, setEditValues] = useState<Record<string, Partial<Tarief>>>(
    Object.fromEntries(tarieven.map(t => [t.id, {}]))
  )

  const updateTarief = async (tarief: Tarief) => {
    setSaving(tarief.id)
    setSuccess('')

    const values = editValues[tarief.id]
    const supabase = createClient()

    const { error } = await supabase
      .from('indicatie_tarieven')
      .update({
        min_bedrag: values.min_bedrag ?? tarief.min_bedrag,
        max_bedrag: values.max_bedrag ?? tarief.max_bedrag,
        standaard_bedrag: values.standaard_bedrag ?? tarief.standaard_bedrag,
        commissie_percentage: values.commissie_percentage ?? tarief.commissie_percentage,
        actief: values.actief ?? tarief.actief,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tarief.id)

    if (!error) {
      setSuccess(`${zorgtypeLabels[tarief.zorgtype]} bijgewerkt`)
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    }

    setSaving(null)
  }

  const getValue = (tarief: Tarief, field: keyof Tarief) => {
    const override = editValues[tarief.id]?.[field as keyof Partial<Tarief>]
    return override !== undefined ? override : tarief[field]
  }

  const setValue = (tarief: Tarief, field: keyof Tarief, value: number | boolean) => {
    setEditValues(prev => ({
      ...prev,
      [tarief.id]: { ...prev[tarief.id], [field]: value }
    }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Indicatietarieven</h1>
        <p className="text-gray-600 mt-1">Beheer de tarieven en commissie per zorgtype</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          ✓ {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Zorgtype</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Min (€/uur)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Max (€/uur)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Standaard</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Commissie %</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actief</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tarieven.map(tarief => (
                <tr key={tarief.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-gray-900 text-sm">
                        {zorgtypeLabels[tarief.zorgtype] || tarief.zorgtype}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="5"
                      max="500"
                      step="0.50"
                      value={getValue(tarief, 'min_bedrag') as number}
                      onChange={e => setValue(tarief, 'min_bedrag', parseFloat(e.target.value))}
                      className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="5"
                      max="500"
                      step="0.50"
                      value={getValue(tarief, 'max_bedrag') as number}
                      onChange={e => setValue(tarief, 'max_bedrag', parseFloat(e.target.value))}
                      className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="5"
                      max="500"
                      step="0.50"
                      value={getValue(tarief, 'standaard_bedrag') as number}
                      onChange={e => setValue(tarief, 'standaard_bedrag', parseFloat(e.target.value))}
                      className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={getValue(tarief, 'commissie_percentage') as number}
                      onChange={e => setValue(tarief, 'commissie_percentage', parseFloat(e.target.value))}
                      className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={getValue(tarief, 'actief') as boolean}
                      onChange={e => setValue(tarief, 'actief', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => updateTarief(tarief)}
                      disabled={saving === tarief.id}
                      className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {saving === tarief.id ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Let op:</strong> Het indicatiebedrag is het tarief op basis van de zorgvraag en indicatie.
        Zorgverleners kunnen een eigen tarief hanteren, maar dit dient binnen de bandbreedte te vallen.
        De commissie wordt automatisch ingehouden bij betaling via Mollie.
      </div>
    </div>
  )
}
