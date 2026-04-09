'use client'

import { useState, useEffect } from 'react'
import {
  PawPrint, Heart, AlertTriangle, KeyRound,
  Save, CheckCircle, Info, Phone, User
} from 'lucide-react'
import type { ZorgvragerProfiel, Mobiliteit, ReanimatieStatus, ToegangsMethode } from '@/types/database'

type Tab = 'algemeen' | 'gezondheid' | 'noodinfo' | 'toegang'

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'algemeen', label: 'Algemeen', icon: PawPrint },
  { id: 'gezondheid', label: 'Gezondheid', icon: Heart },
  { id: 'noodinfo', label: 'Noodinfo', icon: AlertTriangle },
  { id: 'toegang', label: 'Toegang woning', icon: KeyRound },
]

const mobiliteitOpties: { value: Mobiliteit; label: string }[] = [
  { value: 'ZELFSTANDIG', label: 'Zelfstandig' },
  { value: 'ROLLATOR', label: 'Rollator' },
  { value: 'ROLSTOEL', label: 'Rolstoel' },
  { value: 'BEDLEGERIG', label: 'Bedlegerig' },
]

const reanimatieOpties: { value: ReanimatieStatus; label: string }[] = [
  { value: 'JA', label: 'Ja, reanimeer mij' },
  { value: 'NEE', label: 'Nee, niet reanimeren' },
  { value: 'ONBEKEND', label: 'Onbekend / niet ingevuld' },
]

const toegangOpties: { value: ToegangsMethode; label: string; description: string }[] = [
  { value: 'SLEUTELKLUIS', label: 'Sleutelkluis', description: 'Code wordt apart gedeeld met de zorgverlener' },
  { value: 'AANWEZIG_BIJ_AANKOMST', label: 'Aanwezig bij aankomst', description: 'U of een huisgenoot opent de deur' },
  { value: 'MANTELZORGER', label: 'Via mantelzorger', description: 'Een mantelzorger regelt de toegang' },
  { value: 'ANDERS', label: 'Anders', description: 'Beschrijf de afspraak hieronder' },
]

export default function ZorgvragerProfielPage() {
  const [actieveTab, setActieveTab] = useState<Tab>('algemeen')
  const [profiel, setProfiel] = useState<Partial<ZorgvragerProfiel>>({})
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => {
    fetch('/api/zorgvrager-profiel')
      .then(r => r.json())
      .then(data => {
        if (data.profiel) setProfiel(data.profiel)
      })
      .finally(() => setLaden(false))
  }, [])

  const sla = (veld: keyof ZorgvragerProfiel, waarde: unknown) => {
    setProfiel(prev => ({ ...prev, [veld]: waarde }))
  }

  const opslaanProfiel = async () => {
    setOpslaan(true)
    try {
      const res = await fetch('/api/zorgvrager-profiel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profiel),
      })
      if (res.ok) {
        setOpgeslagen(true)
        setTimeout(() => setOpgeslagen(false), 3000)
      }
    } finally {
      setOpslaan(false)
    }
  }

  if (laden) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijn profiel</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Informatie die gedeeld wordt met uw gekoppelde zorgverlener
          </p>
        </div>
        <button
          onClick={opslaanProfiel}
          disabled={opslaan}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {opgeslagen ? (
            <><CheckCircle className="w-4 h-4" /> Opgeslagen</>
          ) : (
            <><Save className="w-4 h-4" /> {opslaan ? 'Bezig...' : 'Opslaan'}</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActieveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  actieveTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab inhoud */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

        {/* ── ALGEMEEN ── */}
        {actieveTab === 'algemeen' && (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900">Huisdieren</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profiel.huisdieren_aanwezig ?? false}
                  onChange={e => sla('huisdieren_aanwezig', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Er zijn huisdieren aanwezig in de woning
                </span>
              </label>

              {profiel.huisdieren_aanwezig && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type huisdier <span className="text-gray-400 font-normal">(optioneel)</span>
                  </label>
                  <input
                    type="text"
                    value={profiel.huisdier_type ?? ''}
                    onChange={e => sla('huisdier_type', e.target.value)}
                    placeholder="bijv. hond, kat, vogel"
                    className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GEZONDHEID ── */}
        {actieveTab === 'gezondheid' && (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900">Gezondheid & aandachtspunten</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergieën
              </label>
              <textarea
                value={profiel.allergieen ?? ''}
                onChange={e => sla('allergieen', e.target.value)}
                rows={3}
                placeholder="bijv. latex, bepaalde medicijnen, pollen..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medische aandachtspunten
              </label>
              <textarea
                value={profiel.medische_aandachtspunten ?? ''}
                onChange={e => sla('medische_aandachtspunten', e.target.value)}
                rows={3}
                placeholder="bijv. diabetes type 2, gebruik van bloedverdunners..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobiliteit <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {mobiliteitOpties.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => sla('mobiliteit', profiel.mobiliteit === opt.value ? undefined : opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      profiel.mobiliteit === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOODINFO ── */}
        {actieveTab === 'noodinfo' && (
          <div className="space-y-8">

            {/* Wilsverklaring */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <span className="font-medium">Uitsluitend ter informatie</span> — Deze gegevens worden
                  gedeeld met uw gekoppelde zorgverlener als achtergrondkennis.
                  ZorgMatch draagt geen medische of juridische verantwoordelijkheid.
                </div>
              </div>

              <h2 className="font-semibold text-gray-900">Wilsverklaring</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reanimatie
                </label>
                <div className="space-y-2">
                  {reanimatieOpties.map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reanimatie"
                        checked={profiel.reanimatie === opt.value}
                        onChange={() => sla('reanimatie', opt.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profiel.dnr_aanwezig ?? false}
                  onChange={e => sla('dnr_aanwezig', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  DNR-verklaring is aanwezig
                </span>
              </label>
            </div>

            {/* Noodmedicatie */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900">Noodinformatie</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profiel.noodmedicatie_aanwezig ?? false}
                  onChange={e => sla('noodmedicatie_aanwezig', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Noodmedicatie is aanwezig in de woning
                </span>
              </label>

              {profiel.noodmedicatie_aanwezig && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toelichting noodmedicatie
                  </label>
                  <textarea
                    value={profiel.noodmedicatie_toelichting ?? ''}
                    onChange={e => sla('noodmedicatie_toelichting', e.target.value)}
                    rows={2}
                    placeholder="bijv. EpiPen in rode tas in keukenlade"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Noodcontact */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Noodcontact</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam noodcontact
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profiel.noodcontact_naam ?? ''}
                      onChange={e => sla('noodcontact_naam', e.target.value)}
                      placeholder="Volledige naam"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoonnummer
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={profiel.noodcontact_telefoon ?? ''}
                      onChange={e => sla('noodcontact_telefoon', e.target.value)}
                      placeholder="06-12345678"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TOEGANG ── */}
        {actieveTab === 'toegang' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-gray-900">Toegang tot de woning</h2>
              <p className="text-sm text-gray-500 mt-1">
                Hoe krijgt de zorgverlener toegang? Sla nooit sleutelcodes op in dit systeem.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">Veiligheidsregel:</span> Bewaar nooit sleutelcodes,
                pincodes of toegangscodes in dit systeem. Deel codes uitsluitend persoonlijk of
                via een beveiligde methode.
              </p>
            </div>

            <div className="space-y-3">
              {toegangOpties.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    profiel.toegang_methode === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="toegang"
                    checked={profiel.toegang_methode === opt.value}
                    onChange={() => sla('toegang_methode', opt.value)}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {profiel.toegang_methode === 'ANDERS' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toelichting toegang{' '}
                  <span className="text-gray-400 font-normal">— beschrijf de afspraak, geen codes</span>
                </label>
                <textarea
                  value={profiel.toegang_toelichting ?? ''}
                  onChange={e => sla('toegang_toelichting', e.target.value)}
                  rows={3}
                  placeholder="bijv. Bel aan bij buurvrouw mevrouw De Vries, zij heeft een sleutel"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobiele opslaan knop */}
      <div className="flex justify-end">
        <button
          onClick={opslaanProfiel}
          disabled={opslaan}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {opgeslagen ? (
            <><CheckCircle className="w-4 h-4" /> Opgeslagen!</>
          ) : (
            <><Save className="w-4 h-4" /> {opslaan ? 'Bezig met opslaan...' : 'Wijzigingen opslaan'}</>
          )}
        </button>
      </div>
    </div>
  )
}
