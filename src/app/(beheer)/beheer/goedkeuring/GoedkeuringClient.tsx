'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, FileText, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface ZorgverlenerProfiel {
  id: string
  gebruiker_id: string
  big_registratie?: string
  kvk_nummer?: string
  zorgtypes: string[]
  werkgebied_km: number
  uurtarief?: number
  bio?: string
  goedgekeurd: boolean
  goedgekeurd_op?: string
  document_status: string
  gebruiker: {
    id: string
    naam: string
    email: string
    telefoon?: string
    stad?: string
    adres?: string
    aangemeld_op: string
  }
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

export function GoedkeuringClient({
  wachtend,
  goedgekeurd,
}: {
  wachtend: ZorgverlenerProfiel[]
  goedgekeurd: ZorgverlenerProfiel[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [afwijzingReden, setAfwijzingReden] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'wachtend' | 'goedgekeurd'>('wachtend')

  const keurGoed = async (profiel: ZorgverlenerProfiel) => {
    setLoading(profiel.id)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: beheerder } = await supabase
      .from('gebruikers')
      .select('id')
      .eq('auth_id', user!.id)
      .single()

    await supabase
      .from('zorgverlener_profielen')
      .update({
        goedgekeurd: true,
        goedgekeurd_op: new Date().toISOString(),
        goedgekeurd_door: beheerder?.id,
        document_status: 'GOEDGEKEURD',
      })
      .eq('id', profiel.id)

    // Send notification to zorgverlener
    await supabase.from('notificaties').insert({
      gebruiker_id: profiel.gebruiker_id,
      type: 'ACCOUNT_GOEDGEKEURD',
      titel: 'Uw account is goedgekeurd!',
      bericht: 'Gefeliciteerd! Uw ZorgMatch account is goedgekeurd. U kunt nu zorgvragen ontvangen.',
    })

    setLoading(null)
    router.refresh()
  }

  const keurAf = async (profiel: ZorgverlenerProfiel) => {
    const reden = afwijzingReden[profiel.id] || ''
    if (!reden) {
      alert('Geef een reden voor afwijzing')
      return
    }

    setLoading(profiel.id)
    const supabase = createClient()

    await supabase
      .from('zorgverlener_profielen')
      .update({
        document_status: 'AFGEKEURD',
        afwijzing_reden: reden,
      })
      .eq('id', profiel.id)

    await supabase.from('notificaties').insert({
      gebruiker_id: profiel.gebruiker_id,
      type: 'ACCOUNT_AFGEKEURD',
      titel: 'Aanvraag niet goedgekeurd',
      bericht: `Uw aanvraag is helaas niet goedgekeurd. Reden: ${reden}`,
    })

    setLoading(null)
    router.refresh()
  }

  const renderProfiel = (profiel: ZorgverlenerProfiel, isExpanded: boolean) => (
    <div key={profiel.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
        onClick={() => setExpanded(isExpanded ? null : profiel.id)}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{profiel.gebruiker.naam}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profiel.document_status === 'IN_BEHANDELING'
                  ? 'bg-amber-100 text-amber-700'
                  : profiel.document_status === 'GOEDGEKEURD'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {profiel.document_status === 'IN_BEHANDELING' ? 'In behandeling' :
                 profiel.document_status === 'GOEDGEKEURD' ? 'Goedgekeurd' : 'Afgekeurd'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{profiel.gebruiker.email}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-500">
              {profiel.gebruiker.stad && <span>{profiel.gebruiker.stad}</span>}
              <span>Aangemeld: {new Date(profiel.gebruiker.aangemeld_op).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {/* Profiel details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">BIG-registratie</p>
              <p className="text-sm font-medium text-gray-900">{profiel.big_registratie || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">KvK-nummer</p>
              <p className="text-sm font-medium text-gray-900">{profiel.kvk_nummer || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Werkgebied</p>
              <p className="text-sm font-medium text-gray-900">{profiel.werkgebied_km} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Uurtarief</p>
              <p className="text-sm font-medium text-gray-900">{profiel.uurtarief ? `€${profiel.uurtarief}` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Telefoon</p>
              <p className="text-sm font-medium text-gray-900">{profiel.gebruiker.telefoon || '-'}</p>
            </div>
          </div>

          {/* Zorgtypes */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Aangeboden zorgtypen</p>
            <div className="flex flex-wrap gap-2">
              {profiel.zorgtypes.map(zt => (
                <span key={zt} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                  {zorgtypeLabels[zt] || zt}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          {profiel.bio && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Omschrijving</p>
              <p className="text-sm text-gray-700">{profiel.bio}</p>
            </div>
          )}

          {/* Documents link */}
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <FileText className="w-4 h-4" />
            <span>Documenten worden opgehaald uit Supabase Storage</span>
          </div>

          {/* Actions - only for non-approved */}
          {!profiel.goedgekeurd && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reden bij afwijzing (verplicht bij afkeuren)
                </label>
                <textarea
                  value={afwijzingReden[profiel.id] || ''}
                  onChange={e => setAfwijzingReden(prev => ({ ...prev, [profiel.id]: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="bv. VOG-document ontbreekt, BIG-nummer niet geldig..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => keurGoed(profiel)}
                  disabled={loading === profiel.id}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading === profiel.id ? 'Verwerken...' : 'Goedkeuren'}
                </button>
                <button
                  onClick={() => keurAf(profiel)}
                  disabled={loading === profiel.id}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Afkeuren
                </button>
              </div>
            </div>
          )}

          {profiel.goedgekeurd && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Goedgekeurd op {profiel.goedgekeurd_op
                  ? new Date(profiel.goedgekeurd_op).toLocaleDateString('nl-NL')
                  : '-'
                }</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goedkeuring zorgverleners</h1>
        <p className="text-gray-600 mt-1">Beoordeel aanmeldingen van nieuwe zzp-zorgverleners</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('wachtend')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'wachtend'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          In behandeling ({wachtend.length})
        </button>
        <button
          onClick={() => setActiveTab('goedgekeurd')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'goedgekeurd'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Goedgekeurd ({goedgekeurd.length})
        </button>
      </div>

      {activeTab === 'wachtend' && (
        <div className="space-y-4">
          {wachtend.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Geen aanvragen in behandeling</p>
            </div>
          ) : (
            wachtend.map(profiel => renderProfiel(profiel, expanded === profiel.id))
          )}
        </div>
      )}

      {activeTab === 'goedgekeurd' && (
        <div className="space-y-4">
          {goedgekeurd.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
              Nog geen goedgekeurde zorgverleners
            </div>
          ) : (
            goedgekeurd.map(profiel => renderProfiel(profiel, expanded === profiel.id))
          )}
        </div>
      )}
    </div>
  )
}
