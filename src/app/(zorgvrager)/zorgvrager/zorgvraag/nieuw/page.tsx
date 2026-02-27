'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

const zorgtypes = [
  { value: 'persoonlijke_verzorging', label: 'Persoonlijke verzorging', desc: 'Hulp bij wassen, aankleden, eten' },
  { value: 'verpleging', label: 'Verpleging', desc: 'Medische verzorging, wondverzorging' },
  { value: 'begeleiding', label: 'Begeleiding', desc: 'Begeleiding bij dagelijkse activiteiten' },
  { value: 'huishoudelijke_hulp', label: 'Huishoudelijke hulp', desc: 'Schoonmaken, boodschappen' },
  { value: 'dagbesteding', label: 'Dagbesteding', desc: 'Sociale activiteiten overdag' },
  { value: 'nachtzorg', label: 'Nachtzorg', desc: 'Zorg en toezicht tijdens de nacht' },
  { value: 'respijtzorg', label: 'Respijtzorg', desc: 'Tijdelijke overname zorg van mantelzorger' },
  { value: 'geestelijke_gezondheidszorg', label: 'GGZ begeleiding', desc: 'Geestelijke gezondheidszorg' },
]

interface FieldErrors {
  zorgtype?: string
  omschrijving?: string
  stad?: string
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </div>
  )
}

export default function NieuweZorgvraagPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({
    zorgtype: '',
    omschrijving: '',
    uren_per_week: '',
    startdatum: '',
    adres: '',
    stad: '',
  })

  const validate = (data: typeof form): FieldErrors => {
    const errors: FieldErrors = {}
    if (!data.zorgtype) errors.zorgtype = 'Kies een type zorg'
    if (!data.omschrijving || data.omschrijving.trim().length < 20)
      errors.omschrijving = 'Beschrijving moet minimaal 20 tekens zijn'
    if (!data.stad || data.stad.trim().length < 2)
      errors.stad = 'Vul een geldige stad in'
    return errors
  }

  const updateField = (field: keyof typeof form, value: string) => {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (touched[field]) {
      const errors = validate(updated)
      setFieldErrors(prev => ({ ...prev, [field]: errors[field as keyof FieldErrors] }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const errors = validate(form)
    setFieldErrors(prev => ({ ...prev, [field]: errors[field as keyof FieldErrors] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ zorgtype: true, omschrijving: true, stad: true })
    const errors = validate(form)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast('Vul alle verplichte velden correct in', 'error')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/inloggen'); return }

      const { data: gebruiker } = await supabase
        .from('gebruikers')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!gebruiker) { toast('Account niet gevonden', 'error'); return }

      const cityCoords: Record<string, { lat: number; lng: number }> = {
        amsterdam: { lat: 52.3676, lng: 4.9041 },
        rotterdam: { lat: 51.9244, lng: 4.4777 },
        'den haag': { lat: 52.0705, lng: 4.3007 },
        utrecht: { lat: 52.0907, lng: 5.1214 },
        eindhoven: { lat: 51.4416, lng: 5.4697 },
        groningen: { lat: 53.2194, lng: 6.5665 },
        default: { lat: 52.3676, lng: 4.9041 },
      }

      const coords = cityCoords[form.stad.toLowerCase()] || cityCoords.default

      const { data: tarief } = await supabase
        .from('indicatie_tarieven')
        .select('standaard_bedrag')
        .eq('zorgtype', form.zorgtype)
        .single()

      const { error: insertError } = await supabase
        .from('zorgvragen')
        .insert({
          zorgvrager_id: gebruiker.id,
          zorgtype: form.zorgtype,
          omschrijving: form.omschrijving,
          indicatiebedrag: tarief?.standaard_bedrag || 30,
          uren_per_week: form.uren_per_week ? parseInt(form.uren_per_week) : null,
          startdatum: form.startdatum || null,
          stad: form.stad,
          adres: form.adres,
          lat: coords.lat,
          lng: coords.lng,
          status: 'OPEN',
        })

      if (insertError) {
        toast('Er ging iets mis. Probeer het opnieuw.', 'error')
        console.error(insertError)
        return
      }

      toast('Uw zorgaanvraag is succesvol ingediend!', 'success')
      setTimeout(() => {
        router.push('/zorgvrager/zorgvragen')
        router.refresh()
      }, 800)
    } catch (err) {
      console.error(err)
      toast('Onverwachte fout opgetreden', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formValid = Object.keys(validate(form)).length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nieuwe zorgaanvraag</h1>
        <p className="text-gray-600 mt-1">Beschrijf uw zorgbehoefte en wij zoeken de juiste zorgverlener</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Zorgtype */}
        <div className={`bg-white rounded-xl border shadow-sm p-6 ${fieldErrors.zorgtype ? 'border-red-200' : 'border-gray-100'}`}>
          <h2 className="font-semibold text-gray-900 mb-4">Welk type zorg heeft u nodig? <span className="text-red-500">*</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zorgtypes.map(zt => (
              <button
                key={zt.value}
                type="button"
                onClick={() => { updateField('zorgtype', zt.value); handleBlur('zorgtype') }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  form.zorgtype === zt.value
                    ? 'border-blue-600 bg-blue-50'
                    : fieldErrors.zorgtype
                      ? 'border-red-200 hover:border-red-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {form.zorgtype === zt.value
                    ? <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    : <Heart className="w-4 h-4 text-gray-400" />
                  }
                  <span className="font-medium text-sm">{zt.label}</span>
                </div>
                <p className="text-xs text-gray-500">{zt.desc}</p>
              </button>
            ))}
          </div>
          <FieldError message={fieldErrors.zorgtype} />
        </div>

        {/* Omschrijving */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Omschrijving <span className="text-red-500">*</span></h2>
          <div>
            <textarea
              value={form.omschrijving}
              onChange={e => updateField('omschrijving', e.target.value)}
              onBlur={() => handleBlur('omschrijving')}
              rows={5}
              className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 resize-none transition-colors ${
                fieldErrors.omschrijving
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-400'
              }`}
              placeholder="Beschrijf wat u nodig heeft, hoe vaak, bijzondere wensen of omstandigheden... (minimaal 20 tekens)"
            />
            <div className="flex items-center justify-between mt-1">
              <FieldError message={fieldErrors.omschrijving} />
              <span className={`text-xs ml-auto ${form.omschrijving.length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
                {form.omschrijving.length}/20+
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uren per week</label>
              <input
                type="number"
                min="1"
                max="168"
                value={form.uren_per_week}
                onChange={e => updateField('uren_per_week', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="bv. 8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gewenste startdatum</label>
              <input
                type="date"
                value={form.startdatum}
                onChange={e => updateField('startdatum', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Locatie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Locatie</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stad / Woonplaats <span className="text-red-500">*</span></label>
              <input
                value={form.stad}
                onChange={e => updateField('stad', e.target.value)}
                onBlur={() => handleBlur('stad')}
                className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.stad
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-400'
                }`}
                placeholder="Amsterdam"
              />
              <FieldError message={fieldErrors.stad} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input
                value={form.adres}
                onChange={e => updateField('adres', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="Straatnaam 1"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>Indicatiebedrag:</strong> Het indicatiebedrag per uur wordt automatisch bepaald op basis van het zorgtype en uw indicatie.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              formValid
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {loading ? 'Aanvraag versturen...' : 'Aanvraag indienen'}
          </button>
        </div>
      </form>
    </div>
  )
}
