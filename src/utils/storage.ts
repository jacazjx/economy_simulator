import type { Params } from '../engine/types'

export function saveParams(params: Params): void {
  localStorage.setItem('economy-sim-params', JSON.stringify(params))
}

export function loadParams(): Params | null {
  const saved = localStorage.getItem('economy-sim-params')
  if (saved) {
    try {
      return JSON.parse(saved) as Params
    } catch {
      return null
    }
  }
  return null
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
