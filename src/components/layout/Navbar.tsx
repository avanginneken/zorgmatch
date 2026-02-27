'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearDemoSession } from '@/lib/demo'
import { Bell, Menu, X, Heart, LogOut, User, Circle } from 'lucide-react'

interface NavbarProps {
  rol?: 'ZORGVRAGER' | 'ZORGVERLENER' | 'BEHEER'
  naam?: string
}

export function Navbar({ rol, naam }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    clearDemoSession()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getDashboardLink = () => {
    if (rol === 'ZORGVRAGER') return '/zorgvrager/dashboard'
    if (rol === 'ZORGVERLENER') return '/zorgverlener/dashboard'
    if (rol === 'BEHEER') return '/beheer/dashboard'
    return '/'
  }

  return (
    <>
      {/* Status banner */}
      {rol && (
        <div className="bg-gray-900 text-xs text-gray-400 text-center py-1 px-4 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-green-400 text-green-400" />
            <span className="text-gray-300">Alle systemen operationeel</span>
          </span>
          <span className="hidden sm:inline text-gray-600">·</span>
          <span className="hidden sm:inline">EU West (Frankfurt) · AVG-conform</span>
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link href={getDashboardLink()} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Zorg<span className="text-blue-600">Match</span></span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              {rol ? (
                <>
                  <span className="text-sm text-gray-500">
                    <span className="text-gray-400 text-xs mr-1">
                      {rol === 'BEHEER' ? '⚙️' : rol === 'ZORGVERLENER' ? '🩺' : '💙'}
                    </span>
                    {naam}
                  </span>
                  <div className="w-px h-4 bg-gray-200" />
                  <Link
                    href="/notificaties"
                    className="relative p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Notificaties"
                  >
                    <Bell className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/profiel"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profiel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <Link href="/inloggen" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    Inloggen
                  </Link>
                  <Link
                    href="/aanmelden"
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Gratis starten
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {rol ? (
              <>
                <p className="text-xs text-gray-500 px-2 py-1 font-medium">Ingelogd als {naam}</p>
                <Link href="/profiel" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Profiel</Link>
                <Link href="/notificaties" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Notificaties</Link>
                <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link href="/aanmelden" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Aanmelden</Link>
                <Link href="/inloggen" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Inloggen</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
