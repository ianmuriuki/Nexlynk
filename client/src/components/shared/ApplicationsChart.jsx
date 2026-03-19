import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/api/client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import clsx from 'clsx'

const PERIODS = [
  { key: 'day',      label: 'Today'    },
  { key: 'week',     label: '7 days'   },
  { key: 'month',    label: '30 days'  },
  { key: '3months',  label: '3 months' },
  { key: '6months',  label: '6 months' },
  { key: 'year',     label: '1 year'   },
]

function formatLabel(isoString, period) {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (period === 'day')
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  if (period === 'week' || period === 'month')
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-navy mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-navy ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ApplicationsChart() {
  const [period, setPeriod] = useState('6months')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats', period],
    queryFn:  () => adminAPI.stats({ period }).then(r => r.data.data ?? r.data),
    keepPreviousData: true,
  })

  const rows = Array.isArray(data) ? data : []

  const chartData = rows.map(r => ({
    ...r,
    label: formatLabel(r.period, period),
  }))

  const totalApps  = rows.reduce((s, r) => s + (r.applications || 0), 0)
  const totalShort = rows.reduce((s, r) => s + (r.shortlisted  || 0), 0)
  const totalPlace = rows.reduce((s, r) => s + (r.placements   || 0), 0)

  return (
    <div className="card p-6 mb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-semibold text-navy">Applications over time</h2>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-DEFAULT inline-block" />
              {totalApps} applications
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              {totalShort} shortlisted
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              {totalPlace} placed
            </span>
          </div>
        </div>

        {/* Period switcher */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                period === p.key
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-navy'
              )}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {isLoading ? (
        <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-300">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-slate-400">No activity in this period</p>
          <p className="text-xs mt-1 text-slate-300">
            {period === 'day' ? 'Try switching to 7 days or 30 days' : 'Data will appear as applications come in'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gApps"   x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1A56DB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1A56DB" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gShort"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gPlace"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: '11px', paddingTop: '16px', color: '#94A3B8' }}
            />

            <Area
              type="monotone"
              dataKey="applications"
              name="Applications"
              stroke="#1A56DB"
              strokeWidth={2}
              fill="url(#gApps)"
              dot={false}
              activeDot={{ r: 4, fill: '#1A56DB', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="shortlisted"
              name="Shortlisted"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#gShort)"
              dot={false}
              activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="placements"
              name="Placed"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gPlace)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}