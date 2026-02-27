import Link from 'next/link'
import { Heart, Shield, Clock, Star, CheckCircle, ArrowRight, MapPin, Bell, CreditCard } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Zorg<span className="text-blue-600">Match</span></span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/inloggen" className="text-sm text-gray-600 hover:text-gray-900">
                Inloggen
              </Link>
              <Link
                href="/aanmelden"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Gratis aanmelden
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            AVG-conform · Alle data in Europa
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Thuis zorg nodig?<br />
            <span className="text-blue-200">Wij regelen het snel.</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            ZorgMatch verbindt mensen die thuiszorg nodig hebben direct met gecertificeerde
            zzp-zorgverleners in de buurt. Snel, veilig en vertrouwd.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/aanmelden?type=zorgvrager"
              className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center gap-2 justify-center"
            >
              <Heart className="w-5 h-5" />
              Ik zoek zorg
            </Link>
            <Link
              href="/aanmelden?type=zorgverlener"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors flex items-center gap-2 justify-center"
            >
              <Star className="w-5 h-5" />
              Ik bied zorg aan
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hoe werkt het?</h2>
            <p className="text-lg text-gray-600">Net zo simpel als een taxi-app, maar dan voor zorg</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Zorgvrager flow */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">Voor zorgvragers</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Meld je gratis aan en beschrijf je zorgbehoefte',
                  'Wij zoeken gecertificeerde zorgverleners in jouw buurt',
                  'Ontvang reacties van beschikbare zorgverleners',
                  'Kies je zorgverlener en betaal veilig via Mollie',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/aanmelden?type=zorgvrager"
                className="mt-6 inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >
                Begin hier <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Zorgverlener flow */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold">Voor zorgverleners (zzp)</h3>
              </div>
              <div className="space-y-4">
                {[
                  "Meld je aan en upload je diploma's, BIG-registratie en VOG",
                  'Wij controleren je documenten en keuren je goed',
                  'Ontvang automatisch meldingen bij zorgvragen in jouw werkgebied',
                  'Reageer op aanvragen en ontvang directe betaling',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-teal-600">{i + 1}</span>
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/aanmelden?type=zorgverlener"
                className="mt-6 inline-flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700"
              >
                Aanmelden als zorgverlener <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'AVG-conform', desc: 'Alle data opgeslagen binnen de EU' },
              { icon: CheckCircle, title: 'Gecertificeerd', desc: 'BIG-geregistreerde zorgverleners' },
              { icon: CreditCard, title: 'Veilig betalen', desc: 'Via Mollie (Nederlands bedrijf)' },
              { icon: Clock, title: 'Snel gekoppeld', desc: 'Gemiddeld binnen 24 uur een match' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zorgtypes */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Welke zorg bieden we?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Persoonlijke verzorging', 'Verpleging', 'Begeleiding',
              'Huishoudelijke hulp', 'Dagbesteding', 'Nachtzorg',
              'Respijtzorg', 'GGZ begeleiding',
            ].map((type, i) => (
              <div key={i} className="border border-gray-200 rounded-xl px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors">
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Klaar om te beginnen?</h2>
          <p className="text-blue-100 text-lg mb-8">Meld je gratis aan. Geen verborgen kosten.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/aanmelden?type=zorgvrager"
              className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Ik zoek zorg
            </Link>
            <Link
              href="/aanmelden?type=zorgverlener"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 border-2 border-blue-400 transition-colors"
            >
              Ik bied zorg aan
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">ZorgMatch</span>
          </div>
          <p className="text-sm">© 2026 ZorgMatch · Alle data opgeslagen in de EU · AVG-conform</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/voorwaarden" className="hover:text-white">Voorwaarden</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
