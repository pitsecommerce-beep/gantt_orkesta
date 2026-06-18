'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface LineConfig {
  key: string
  label: string
  color: string
}

interface ChartLineProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: LineConfig[]
  title?: string
  height?: number
}

export default function ChartLine({
  data,
  xKey,
  lines,
  title,
  height = 300,
}: ChartLineProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      {title ? (
        <h3 className="mb-3 font-serif text-lg text-navy">{title}</h3>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DED5" />
          <XAxis dataKey={xKey} stroke="#2D2D2D" fontSize={12} />
          <YAxis stroke="#2D2D2D" fontSize={12} />
          <Tooltip />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
