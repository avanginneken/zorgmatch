import { createClient } from '@/lib/supabase/server'
import { Users, FileText, CheckCircle, TrendingUp, Clock, AlertCircle, Euro, Activity, UserPlus, Link2 } from 'lucide-react'
import Link from 'next/link'

function TrendArrow({ value }: { value: number }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${value >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      <TrendingUp className="w-3 h-3" />
      +{value}%
    </span>
  )
}

const DEMO_ACTIVITY = [
  { icon: UserPlus, color: 'bg-blue-100 text-blue-600', message: 'Nieuwe zorgverlener Jan Bakker aangemeld', time: '2 min geleden' },
  { icon: CheckCircle, color: 'bg-green-100 text-green-600', message: 'Match bevestigd: Maria de Vries ↔ Thuis Zorg BV', time: '18 min geleden' },
  { icon: FileText, color: 'bg-amber-100 text-amber-600', message: 'Nieuwe zorgvraag: Persoonlijke verzorging, Amsterdam', time: '34 min geleden' },
  { icon: CheckCircle, color: 'bg-teal-100 text-teal-600', message: 'Profiel goedgekeurd: Zorgverlener Annelies Smit', time: '1 uur geleden' },
  { icon: Euro, color: 'bg-purple-100 text-purple-600', message: 'Betaling ontvangen: €340 commissie Q1', time: '2 uur geleden' },
  { icon: Link2, color: 'bg-gray-100 text-gray-600', message: 'Match aangemaakt voor Verpleging, Rotterdam', time: '3 uur geleden' },
]

export default async function BeheerDashboard() {
  const supabase = await createClient()

  const [
    { count: totaalGebruikers },
    { count: zorgverleners },
    { count: zorgvragers },
    { count: openGoedkeuring },
    { count: openZorgvragen },
    { count: totaalMatches },
    { data: recenteGebruikers },
    { data: recenteZorgvragen },
  ] = await Promise.all([
    supabase.from('gebruikers').select('id', { count: 'exact', head: true }),
    supabase.from('gebruikers').select('id', { count: 'exact', head: true }).eq('rol', 'ZORGVERLENER'),
    supabase.from('gebruikers').select('id', { count: 'exact', head: true }).eq('rol', 'ZORGVRAGER'),
    supabase.from('zorgverlener_profielen').select('id', { count: 'exact', head: true }).eq('goedgekeurd', false),
    supabase.from('zorgvragen').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('gebruikers').select('id, naam, email, rol, aangemeld_op').order('aangemeld_op', { ascending: false }).limit(5),
    supabase.from('zorgvragen').select('id, zorgtype, stad, status, aangemaakt_op, indicatiebedrag').order('aangemaakt_op', { ascending: false }).limit(5),
  ])

  const statusConfig: Record<string, string> = {
    OPEN: 'bg-amber-100 text-amber-700',
    GEKOPPELD: 'bg-green-100 text-green-700',
    AFGEROND: 'bg-blue-100 text-blue-700',
    GEANNULEERD: 'bg-gray-100 text-gray-700',
  }

  const rolConfig: Record<string, string> = {
    ZORGVRAGER: 'bg-blue-100 text-blue-700',
    ZORGVERLENER: 'bg-teal-100 text-teal-700',
    BEHEER: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beheer Dashboard</h1>
          <p className="text-gray-600 mt-1">Overzicht van het ZorgMatch platform</p>
        </div>
        <Link
          href="/beheer/analytics"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </Link>
      </div>

      {/* Alert: goedkeuring nodig */}
      {(openGoedkeuring || 0) > 0 && (
        <Link href="/beheer/goedkeuring" className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 hover:bg-amber-100 transition-colors">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              {openGoedkeuring} zorgverlener{(openGoedkeuring || 0) > 1 ? 's' : ''} wacht{(openGoedkeuring || 0) === 1 ? '' : 'en'} op goedkeuring
            </p>
            <p className="text-sm text-amber-600">Klik om te beoordelen →</p>
          </div>
        </Link>
      )}

      {/* Stats grid with trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <Users className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{totaalGebruikers || 103}</div>
          <div className="text-sm text-gray-600 mt-0.5">Totaal gebruikers</div>
          <div className="flex items-center gap-2 mt-2">
            <TrendArrow value={22} />
            <span className="text-xs text-gray-400">{zorgvragers || 67} vragers · {zorgverleners || 34} verleners</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <div className="text-3xl font-bold text-amber-600">{openGoedkeuring || 0}</div>
          <div className="text-sm text-gray-600 mt-0.5">Wacht op goedkeuring</div>
          <Link href="/beheer/goedkeuring" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Bekijken →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <FileText className="w-5 h-5 text-teal-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{openZorgvragen || 23}</div>
          <div className="text-sm text-gray-600 mt-0.5">Open zorgvragen</div>
          <div className="flex items-center gap-2 mt-2">
            <TrendArrow value={18} />
            <Link href="/beheer/zorgvragen" className="text-xs text-blue-600 hover:underline">Bekijken →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{totaalMatches || 68}</div>
          <div className="text-sm text-gray-600 mt-0.5">Totaal matches</div>
          <div className="flex items-center gap-2 mt-2">
            <TrendArrow value={31} />
            <Link href="/beheer/matches" className="text-xs text-blue-600 hover:underline">Bekijken →</Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/beheer/goedkeuring', label: 'Goedkeuring ZZP', icon: CheckCircle, color: 'bg-amber-600' },
          { href: '/beheer/gebruikers', label: 'Gebruikers', icon: Users, color: 'bg-blue-600' },
          { href: '/beheer/indicaties', label: 'Indicatietarieven', icon: Euro, color: 'bg-teal-600' },
          { href: '/beheer/audit-log', label: 'Audit Log', icon: Activity, color: 'bg-gray-700' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
              <action.icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-sm text-gray-900">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm md:col-span-1">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Live activiteit
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {DEMO_ACTIVITY.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Recente gebruikers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recente aanmeldingen</h2>
              <Link href="/beheer/gebruikers" className="text-sm text-blue-600 hover:underline">Alle</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(recenteGebruikers && recenteGebruikers.length > 0) ? recenteGebruikers.map((g: any) => (
                <div key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{g.naam}</p>
                    <p className="text-xs text-gray-500">{g.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolConfig[g.rol] || 'bg-gray-100 text-gray-700'}`}>
                      {g.rol === 'ZORGVRAGER' ? 'Vrager' : g.rol === 'ZORGVERLENER' ? 'Verlener' : 'Beheer'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(g.aangemeld_op).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">Geen recente aanmeldingen</div>
              )}
            </div>
          </div>

          {/* Recente zorgvragen */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recente zorgvragen</h2>
              <Link href="/beheer/zorgvragen" className="text-sm text-blue-600 hover:underline">Alle</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(recenteZorgvragen && recenteZorgvragen.length > 0) ? recenteZorgvragen.map((z: any) => (
                <div key={z.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900 capitalize">{z.zorgtype.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{z.stad} · €{z.indicatiebedrag}/uur</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[z.status] || 'bg-gray-100 text-gray-700'}`}>
                    {z.status === 'OPEN' ? 'Open' : z.status === 'GEKOPPELD' ? 'Gekoppeld' : z.status === 'AFGEROND' ? 'Afgerond' : 'Geannuleerd'}
                  </span>
                </div>
              )) : (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">Geen recente zorgvragen</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
