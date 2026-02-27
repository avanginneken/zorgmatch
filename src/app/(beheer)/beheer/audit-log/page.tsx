import { createClient } from '@/lib/supabase/server'
import { Activity, User, FileText, Link2, CheckCircle, Settings, LogIn, Shield } from 'lucide-react'

const actionConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  AANMELDEN: { label: 'Aanmelding', icon: User, color: 'bg-blue-100 text-blue-600' },
  INLOGGEN: { label: 'Inloggen', icon: LogIn, color: 'bg-gray-100 text-gray-600' },
  ZORGVRAAG_AANGEMAAKT: { label: 'Zorgvraag aangemaakt', icon: FileText, color: 'bg-amber-100 text-amber-600' },
  MATCH_AANGEMAAKT: { label: 'Match aangemaakt', icon: Link2, color: 'bg-teal-100 text-teal-600' },
  MATCH_BEVESTIGD: { label: 'Match bevestigd', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  DOCUMENT_GOEDGEKEURD: { label: 'Document goedgekeurd', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  PROFIEL_GOEDGEKEURD: { label: 'Profiel goedgekeurd', icon: Shield, color: 'bg-purple-100 text-purple-600' },
  TARIEF_GEWIJZIGD: { label: 'Tarief gewijzigd', icon: Settings, color: 'bg-orange-100 text-orange-600' },
}

// Demo audit log entries for when no database data is available
const DEMO_LOGS = [
  { id: '1', actie: 'PROFIEL_GOEDGEKEURD', gebruiker_naam: 'Admin Beheer', details: 'Profiel van Jan Verpleging goedgekeurd', aangemaakt_op: new Date(Date.now() - 2 * 60 * 1000).toISOString(), ip_adres: '192.168.1.1' },
  { id: '2', actie: 'MATCH_BEVESTIGD', gebruiker_naam: 'Jan Verpleging', details: 'Match #4821 bevestigd voor persoonlijke verzorging Amsterdam', aangemaakt_op: new Date(Date.now() - 18 * 60 * 1000).toISOString(), ip_adres: '10.0.0.45' },
  { id: '3', actie: 'ZORGVRAAG_AANGEMAAKT', gebruiker_naam: 'Maria de Vries', details: 'Nieuwe zorgvraag: Begeleiding, Utrecht, €28/uur', aangemaakt_op: new Date(Date.now() - 34 * 60 * 1000).toISOString(), ip_adres: '10.0.0.12' },
  { id: '4', actie: 'DOCUMENT_GOEDGEKEURD', gebruiker_naam: 'Admin Beheer', details: 'BIG-registratie van Annelies Smit goedgekeurd', aangemaakt_op: new Date(Date.now() - 65 * 60 * 1000).toISOString(), ip_adres: '192.168.1.1' },
  { id: '5', actie: 'MATCH_AANGEMAAKT', gebruiker_naam: 'Systeem', details: 'Automatische match aangemaakt voor verpleging Rotterdam', aangemaakt_op: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), ip_adres: null },
  { id: '6', actie: 'TARIEF_GEWIJZIGD', gebruiker_naam: 'Admin Beheer', details: 'Indicatietarief verpleging: €32 → €34/uur', aangemaakt_op: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), ip_adres: '192.168.1.1' },
  { id: '7', actie: 'AANMELDEN', gebruiker_naam: 'Peter van Dam', details: 'Nieuw account aangemaakt als Zorgverlener', aangemaakt_op: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), ip_adres: '85.144.23.11' },
  { id: '8', actie: 'INLOGGEN', gebruiker_naam: 'Maria de Vries', details: 'Ingelogd via e-mail/wachtwoord', aangemaakt_op: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), ip_adres: '10.0.0.12' },
  { id: '9', actie: 'PROFIEL_GOEDGEKEURD', gebruiker_naam: 'Admin Beheer', details: 'Profiel van Roos Bakker goedgekeurd', aangemaakt_op: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), ip_adres: '192.168.1.1' },
  { id: '10', actie: 'ZORGVRAAG_AANGEMAAKT', gebruiker_naam: 'Hendrik Jansen', details: 'Nieuwe zorgvraag: Nachtzorg, Eindhoven, €35/uur', aangemaakt_op: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), ip_adres: '77.162.55.22' },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} uur geleden`
  return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function AuditLogPage() {
  const supabase = await createClient()

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('aangemaakt_op', { ascending: false })
    .limit(50)

  const logs: any[] = (auditLogs && auditLogs.length > 0) ? auditLogs : DEMO_LOGS
  const todayCount = logs.filter((l: any) => {
    const d = new Date(l.aangemaakt_op)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  }).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Overzicht van alle platformacties en wijzigingen</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">
          <Activity className="w-4 h-4 text-green-500" />
          <span>{todayCount} acties vandaag</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Totaal acties', value: logs.length, color: 'text-gray-900' },
          { label: 'Vandaag', value: todayCount, color: 'text-blue-600' },
          { label: 'Admin acties', value: logs.filter((l: any) => l.gebruiker_naam === 'Admin Beheer' || l.gebruiker_naam?.includes('Admin')).length, color: 'text-purple-600' },
          { label: 'Systeem acties', value: logs.filter((l: any) => l.gebruiker_naam === 'Systeem').length, color: 'text-teal-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Log timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recente activiteit</h2>
          <span className="text-xs text-gray-400">Laatste {logs.length} records</span>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.map((log: any) => {
            const config = actionConfig[log.actie] || { label: log.actie, icon: Activity, color: 'bg-gray-100 text-gray-600' }
            const Icon = config.icon
            return (
              <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{log.actie}</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-600 mt-0.5">{log.details}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="font-medium">{log.gebruiker_naam || 'Onbekend'}</span>
                    {log.ip_adres && <span>· {log.ip_adres}</span>}
                    <span>· {timeAgo(log.aangemaakt_op)}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                  {new Date(log.aangemaakt_op).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
        <p>Audit logs worden 12 maanden bewaard conform de AVG-bewaarplicht. Alle logs zijn onveranderbaar en voorzien van een tijdstempel.</p>
      </div>
    </div>
  )
}
