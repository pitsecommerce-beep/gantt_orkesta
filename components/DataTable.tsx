'use client'

import type React from 'react'
import { useState } from 'react'

interface Column<T> {
  key: keyof T & string
  label: string
  align?: 'left' | 'right'
  format?: (v: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowClassName?: (row: T) => string
  sortable?: boolean
}

type SortDir = 'asc' | 'desc'

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  rowClassName,
  sortable = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: keyof T & string) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedRows = (() => {
    if (!sortable || !sortKey) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      let cmp: number
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av).localeCompare(String(bv))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  })()

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm">
      <table className="w-full border-collapse font-sans text-sm">
        <thead>
          <tr className="bg-navy text-white">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-3 py-2 font-semibold ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${sortable ? 'cursor-pointer select-none' : ''}`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortable && sortKey === col.key ? (
                    <span aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? 'bg-white' : 'bg-sand'} ${
                rowClassName ? rowClassName(row) : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 text-dark ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.format
                    ? col.format(row[col.key], row)
                    : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
