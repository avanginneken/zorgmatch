'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home, FileText, Users, CheckSquare, BarChart2,
  Settings, Bell, CreditCard, User, Briefcase,
  ChevronLeft, ChevronRight, Link2, ClipboardList,
  Heart
} from 'lucide-react'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const zorgvragerItems: SidebarItem[] = [
  { href: '/zorgvrager/dashboard', label: 'Dashboard', icon: Home },
  { href: '/zorgvrager/zorgvraag/nieuw', label: 'Nieuwe aanvraag', icon: FileText },
  { href: '/zorgvrager/zorgvragen', label: 'Mijn aanvragen', icon: ClipboardList },
  { href: '/zorgvrager/betalingen', label: 'Betalingen', icon: CreditCard },
  { href: '/profiel', label: 'Profiel', icon: User },
]

const zorgverlenerItems: SidebarItem[] = [
  { href: '/zorgverlener/dashboard', label: 'Dashboard', icon: Home },
  { href: '/zorgverlener/opdrachten', label: 'Beschikbare opdrachten', icon: Briefcase },
  { href: '/zorgverlener/mijn-opdrachten', label: 'Mijn opdrachten', icon: CheckSquare },
  { href: '/zorgverlener/documenten', label: 'Documenten', icon: FileText },
  { href: '/zorgverlener/betalingen', label: 'Betalingen', icon: CreditCard },
  { href: '/zorgverlener/onboarding', label: 'Onboarding', icon: ClipboardList },
  { href: '/profiel', label: 'Profiel', icon: User },
]

const beheerItems: SidebarItem[] = [
  { href: '/beheer/dashboard', label: 'Dashboard', icon: Home },
  { href: '/beheer/gebruikers', label: 'Gebruikers', icon: Users },
  { href: '/beheer/goedkeuring', label: 'Goedkeuring', icon: CheckSquare },
  { href: '/beheer/zorgvragen', label: 'Zorgvragen', icon: FileText },
  { href: '/beheer/matches', label: 'Matches', icon: Link2 },
  { href: '/beheer/indicaties', label: 'Indicatietarieven', icon: Settings },
  { href: '/beheer/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/beheer/audit-log', label: 'Audit Log', icon: ClipboardList },
]

interface SidebarProps {
  rol: 'ZORGVRAGER' | 'ZORGVERLENER' | 'BEHEER'
}

export function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const items = rol === 'ZORGVRAGER'
    ? zorgvragerItems
    : rol === 'ZORGVERLENER'
      ? zorgverlenerItems
      : beheerItems

  const rolLabel = rol === 'ZORGVRAGER' ? 'Zorgvrager' : rol === 'ZORGVERLENER' ? 'Zorgverlener' : 'Beheer'

  return (
    <aside
      className={`
        hidden md:flex flex-col min-h-screen bg-gray-900 border-r border-gray-800
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo area (collapsed shows icon only) */}
      <div className={`flex items-center h-16 border-b border-gray-800 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 gap-2'}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-white" />
          </div>
        ) : (
          <>
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Zorg<span className="text-blue-400">Match</span></span>
            <span className="ml-auto text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
              {rolLabel}
            </span>
          </>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Inklappen</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
