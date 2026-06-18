'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ChartBarProps {
  data: Record<string, unknown>[]
  xKey: string
  barKey: string
  title?: string
  color?: string
  height?: number
}

export default function ChartBar({
  data,
  xKey,
  barKey,
  title,
  color = '#4A8B8C',
  height = 300,
}: ChartBarProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      {title ? (
        <h3 className="mb-3 font-serif text-lg text-navy">{title}</h3>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DED5" />
          <XAxis dataKey={xKey} stroke="#2D2D2D" fontSize={12} />
          <YAxis stroke="#2D2D2D" fontSize={12} />
          <Tooltip />
          <Bar dataKey={barKey} fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
