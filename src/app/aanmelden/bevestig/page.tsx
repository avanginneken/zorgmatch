import Link from 'next/link'
import { Heart, Mail, CheckCircle } from 'lucide-react'

export default function BevestigPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Zorg<span className="text-blue-600">Match</span></span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Account aangemaakt!</h1>
          <div className="flex items-center gap-2 justify-center text-gray-600 mb-4">
            <Mail className="w-4 h-4" />
            <p className="text-sm">
              We hebben een bevestigingsmail gestuurd. Klik op de link in uw e-mail om uw account te activeren.
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
            Geen e-mail ontvangen? Controleer uw spam-map of{' '}
            <button className="font-medium underline">stuur opnieuw</button>.
          </div>
          <Link
            href="/inloggen"
            className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Naar inloggen
          </Link>
        </div>
      </div>
    </div>
  )
}
