'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const MONTHS = ['Sep', 'Okt', 'Nov', 'Dec', 'Jan', 'Feb']

const GROWTH_DATA = [
  { maand: 'Sep', gebruikers: 12, zorgvragen: 8, matches: 5 },
  { maand: 'Okt', gebruikers: 28, zorgvragen: 19, matches: 12 },
  { maand: 'Nov', gebruikers: 45, zorgvragen: 33, matches: 22 },
  { maand: 'Dec', gebruikers: 61, zorgvragen: 48, matches: 35 },
  { maand: 'Jan', gebruikers: 84, zorgvragen: 67, matches: 51 },
  { maand: 'Feb', gebruikers: 103, zorgvragen: 89, matches: 68 },
]

const COMMISSIE_DATA = [
  { maand: 'Sep', commissie: 420 },
  { maand: 'Okt', commissie: 890 },
  { maand: 'Nov', commissie: 1340 },
  { maand: 'Dec', commissie: 2150 },
  { maand: 'Jan', commissie: 3280 },
  { maand: 'Feb', commissie: 4710 },
]

const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    fontSize: '12px',
  },
  cursor: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' },
}

export function GrowthChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Platform groei</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gebruikers, zorgvragen en matches per maand</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">Afgelopen 6 maanden</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={GROWTH_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="maand" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
          <Line type="monotone" dataKey="gebruikers" name="Gebruikers" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="zorgvragen" name="Zorgvragen" stroke="#14b8a6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="matches" name="Matches" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CommissieChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Commissie-inkomsten</h2>
          <p className="text-xs text-gray-500 mt-0.5">Cumulatief per maand (€)</p>
        </div>
        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">Groeitrend ↑</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={COMMISSIE_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="maand" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: number | undefined) => [`€${value ?? 0}`, 'Commissie']}
          />
          <Bar dataKey="commissie" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
