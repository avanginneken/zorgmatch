'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const segmentLabels: Record<string, string> = {
  'beheer': 'Beheer',
  'zorgvrager': 'Zorgvrager',
  'zorgverlener': 'Zorgverlener',
  'dashboard': 'Dashboard',
  'gebruikers': 'Gebruikers',
  'goedkeuring': 'Goedkeuring',
  'zorgvragen': 'Zorgvragen',
  'matches': 'Matches',
  'indicaties': 'Indicatietarieven',
  'analytics': 'Analytics',
  'audit-log': 'Audit Log',
  'betalingen': 'Betalingen',
  'profiel': 'Profiel',
  'notificaties': 'Notificaties',
  'mijn-opdrachten': 'Mijn opdrachten',
  'opdrachten': 'Opdrachten',
  'documenten': 'Documenten',
  'onboarding': 'Onboarding',
  'nieuw': 'Nieuw',
  'zorgvraag': 'Zorgvraag',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs: { label: string; href: string }[] = []
  let currentPath = ''

  for (const seg of segments) {
    currentPath += `/${seg}`
    const label = segmentLabels[seg] || seg
    crumbs.push({ label, href: currentPath })
  }

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4">
      <Link href="/" className="hover:text-gray-700 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-gray-300" />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-700 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-700 transition-colors capitalize">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
