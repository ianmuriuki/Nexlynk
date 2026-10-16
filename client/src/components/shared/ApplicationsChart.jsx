import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/api/admin'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import clsx from 'clsx'
import Icon from '@/components/Icon'

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
    <div className="rounded-xl border border-line-2 bg-white px-4 py-3 text-xs shadow-pop">
      <p className="mb-2 font-bold text-brand">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="capitalize text-ink-3">{p.name}:</span>
          <span className="ml-auto pl-4 font-bold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ApplicationsChart() {
  const [period, setPeriod] = useState('6months')

  const { data, isPending, isError } = useQuery({
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
          <h2 className="font-extrabold text-ink">Applications over time</h2>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs text-ink-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand inline-block" />
              {totalApps} applications
            </span>
            <span className="text-xs text-ink-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-ink inline-block" />
              {totalShort} shortlisted
            </span>
            <span className="text-xs text-ink-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              {totalPlace} placed
            </span>
          </div>
        </div>

        {/* Period switcher */}
        <div className="flex gap-1 bg-canvas-2 rounded-xl p-1 flex-shrink-0">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                period === p.key
                  ? 'bg-white text-brand shadow-soft'
                  : 'text-ink-3 hover:text-brand'
              )}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {isPending ? (
        <div className="h-56 rounded-xl bg-canvas-2 animate-shimmer" />
      ) : isError ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
          <Icon name="alert-circle" size={28} className="text-warning" />
          <p className="text-sm font-semibold text-ink-2">Could not load application activity</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-ink-4">
<Icon name="bar-chart" size={44} className="mb-3 text-line-2" />
          <p className="text-sm font-semibold text-ink-3">No activity in this period</p>
          <p className="mt-1 text-xs text-ink-4">
            {period === 'day' ? 'Try switching to 7 days or 30 days' : 'Data will appear as applications come in'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gApps"   x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6D5DF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6D5DF6" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gShort"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4A3CC7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4A3CC7" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gPlace"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#21B26B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#21B26B" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ECEDF3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#767C8B', fontFamily: 'Manrope', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#767C8B', fontFamily: 'Manrope', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E3EC', strokeWidth: 1 }} />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: '11px', paddingTop: '16px', color: '#767C8B', fontFamily: 'Manrope', fontWeight: 600 }}
            />

            <Area
              type="monotone"
              dataKey="applications"
              name="Applications"
              stroke="#6D5DF6"
              strokeWidth={2}
              fill="url(#gApps)"
              dot={false}
              activeDot={{ r: 4, fill: '#6D5DF6', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="shortlisted"
              name="Shortlisted"
              stroke="#4A3CC7"
              strokeWidth={2}
              fill="url(#gShort)"
              dot={false}
              activeDot={{ r: 4, fill: '#4A3CC7', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="placements"
              name="Placed"
              stroke="#21B26B"
              strokeWidth={2}
              fill="url(#gPlace)"
              dot={false}
              activeDot={{ r: 4, fill: '#21B26B', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}