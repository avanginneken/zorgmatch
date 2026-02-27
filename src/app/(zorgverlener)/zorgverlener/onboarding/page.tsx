import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Circle, FileText, User, CreditCard, Shield, Briefcase, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    id: 'profiel',
    title: 'Profiel aanmaken',
    description: 'Vul uw persoonlijke gegevens en specialisaties in',
    icon: User,
    href: '/profiel',
    actionLabel: 'Naar profiel',
    required: true,
  },
  {
    id: 'big',
    title: 'BIG-registratie uploaden',
    description: 'Upload uw geldige BIG-registratiebewijs',
    icon: Shield,
    href: '/zorgverlener/documenten',
    actionLabel: 'Documenten uploaden',
    required: true,
  },
  {
    id: 'vog',
    title: 'VOG-verklaring',
    description: 'Upload uw Verklaring Omtrent Gedrag (niet ouder dan 3 maanden)',
    icon: FileText,
    href: '/zorgverlener/documenten',
    actionLabel: 'Document uploaden',
    required: true,
  },
  {
    id: 'kvk',
    title: 'KvK-uittreksel',
    description: 'Upload een recent KvK-uittreksel van uw zzp-bedrijf',
    icon: Briefcase,
    href: '/zorgverlener/documenten',
    actionLabel: 'Document uploaden',
    required: true,
  },
  {
    id: 'betaling',
    title: 'Betaalgegevens instellen',
    description: 'Voer uw IBAN-rekeningnummer in voor uitbetalingen',
    icon: CreditCard,
    href: '/zorgverlener/betalingen',
    actionLabel: 'Betalingen instellen',
    required: true,
  },
  {
    id: 'goedkeuring',
    title: 'Wachten op goedkeuring',
    description: 'Ons team beoordeelt uw documenten binnen 2 werkdagen',
    icon: CheckCircle,
    href: null,
    actionLabel: null,
    required: true,
  },
]

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiel } = await supabase
    .from('zorgverlener_profielen')
    .select('goedgekeurd, document_status, bio, specialisaties, kvk_nummer, iban')
    .eq('auth_id', user?.id ?? '')
    .single()

  const completedSteps = new Set<string>()
  if (profiel?.bio || profiel?.specialisaties) completedSteps.add('profiel')
  if (profiel?.document_status === 'GOEDGEKEURD' || profiel?.goedgekeurd) {
    completedSteps.add('big')
    completedSteps.add('vog')
    completedSteps.add('kvk')
  }
  if (profiel?.iban) completedSteps.add('betaling')
  if (profiel?.goedgekeurd) completedSteps.add('goedkeuring')

  const totalRequired = steps.filter(s => s.required).length
  const completed = completedSteps.size
  const pct = Math.round((completed / totalRequired) * 100)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        <p className="text-gray-600 mt-1">Voltooi uw registratie om opdrachten te kunnen accepteren</p>
      </div>

      {/* Progress card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-blue-100 text-sm font-medium">Voortgang</p>
            <p className="text-3xl font-bold mt-1">{pct}%</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
            <span className="text-lg font-bold">{completed}/{totalRequired}</span>
          </div>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-2 bg-white rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 ? (
          <p className="text-blue-100 text-sm mt-3">Gefeliciteerd! Uw profiel is compleet en goedgekeurd. U kunt nu opdrachten accepteren.</p>
        ) : (
          <p className="text-blue-100 text-sm mt-3">Voltooi de onderstaande stappen om te beginnen met het accepteren van zorgvragen.</p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = completedSteps.has(step.id)
          const Icon = step.icon
          const isLast = i === steps.length - 1

          return (
            <div
              key={step.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                done ? 'border-green-200' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Step indicator */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {done
                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : <Circle className="w-5 h-5 text-gray-400" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${done ? 'text-green-800' : 'text-gray-900'}`}>
                      {i + 1}. {step.title}
                    </p>
                    {done && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Klaar</span>
                    )}
                    {step.required && !done && (
                      <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Vereist</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>

                {/* Action */}
                {!done && step.href && step.actionLabel && (
                  <Link
                    href={step.href}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    {step.actionLabel}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}

                {!done && !step.href && (
                  <span className="text-xs text-gray-400 flex-shrink-0">Automatisch</span>
                )}
              </div>

              {!isLast && !done && (
                <div className="mx-4 border-t border-gray-50" />
              )}
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Verificatietijd:</strong> Ons team beoordeelt uw documenten binnen 2 werkdagen.
          U ontvangt een e-mail zodra uw profiel is goedgekeurd en u opdrachten kunt accepteren.
        </div>
      </div>
    </div>
  )
}
