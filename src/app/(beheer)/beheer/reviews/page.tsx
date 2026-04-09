import { createClient } from '@/lib/supabase/server'
import { Star, Flag, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import { BeheerReviewActies } from './BeheerReviewActies'

function Sterren({ scores }: { scores: Record<string, number> }) {
  const waarden = Object.values(scores).filter(v => typeof v === 'number')
  if (waarden.length === 0) return null
  const gem = (waarden.reduce((a, b) => a + b, 0) / waarden.length).toFixed(1)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(Number(gem)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-600 ml-1">{gem}/5</span>
    </div>
  )
}

const statusBadge: Record<string, string> = {
  INGEDIEND: 'bg-amber-50 text-amber-700 border-amber-200',
  ZICHTBAAR: 'bg-green-50 text-green-700 border-green-200',
  GEMELD: 'bg-red-50 text-red-700 border-red-200',
  VERBORGEN: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default async function BeheerReviewsPage() {
  const supabase = await createClient()

  const { data: gemeld } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:gebruikers!reviews_reviewer_id_fkey (naam, email),
      reviewee:gebruikers!reviews_reviewee_id_fkey (naam, email)
    `)
    .eq('status', 'GEMELD')
    .order('gemeld_op', { ascending: false })

  const { data: recent } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:gebruikers!reviews_reviewer_id_fkey (naam, email),
      reviewee:gebruikers!reviews_reviewee_id_fkey (naam, email)
    `)
    .in('status', ['ZICHTBAAR', 'VERBORGEN'])
    .order('aangemaakt_op', { ascending: false })
    .limit(20)

  const { count: totaal } = await supabase
    .from('reviews').select('*', { count: 'exact', head: true })
  const { count: zichtbaar } = await supabase
    .from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'ZICHTBAAR')
  const { count: meldingen } = await supabase
    .from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'GEMELD')

  const gemeldItems = gemeld || []
  const recentItems = recent || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews beheren</h1>
        <p className="text-gray-600 mt-1 text-sm">Modereer gemelde beoordelingen en bekijk het reviewoverzicht</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <Star className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totaal ?? 0}</div>
          <div className="text-sm text-gray-600 mt-1">Totaal reviews</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{zichtbaar ?? 0}</div>
          <div className="text-sm text-gray-600 mt-1">Zichtbaar</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-red-600">{meldingen ?? 0}</div>
          <div className="text-sm text-gray-600 mt-1">Gemeld / actie vereist</div>
        </div>
      </div>

      {/* Gemelde reviews */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold text-gray-900">Gemelde reviews</h2>
          {gemeldItems.length > 0 && (
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {gemeldItems.length} actie vereist
            </span>
          )}
        </div>

        {gemeldItems.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Geen gemelde reviews</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {gemeldItems.map((r: any) => (
              <div key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {(r.reviewer as any)?.naam} → {(r.reviewee as any)?.naam}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <Sterren scores={r.scores} />
                    {r.tekst && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{r.tekst}"</p>
                    )}
                    {r.gemeld_reden && (
                      <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="font-medium">Meldreden:</span> {r.gemeld_reden}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Gemeld op {r.gemeld_op ? new Date(r.gemeld_op).toLocaleDateString('nl-NL') : '—'}
                    </p>
                  </div>
                  <BeheerReviewActies reviewId={r.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recente reviews */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-gray-900">Recente reviews</h2>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">Nog geen reviews</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentItems.map((r: any) => (
              <div key={r.id} className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {(r.reviewer as any)?.naam} → {(r.reviewee as any)?.naam}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge[r.status] || ''}`}>
                      {r.status}
                    </span>
                  </div>
                  <Sterren scores={r.scores} />
                  {r.tekst && (
                    <p className="text-xs text-gray-500 mt-1 truncate italic">"{r.tekst}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.aangemaakt_op).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                {r.status === 'ZICHTBAAR' && (
                  <BeheerReviewActies reviewId={r.id} toonGoedkeuren={false} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
