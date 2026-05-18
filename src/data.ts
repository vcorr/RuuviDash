import type { Sample } from './ruuvi/types'

export type RoomKind = 'AIR' | 'Temp'

export interface Room {
  id: string; name: string; kind: RoomKind;
  mac: string; battery: number; signal: number; fw: string;
  series: {
    temp: Sample[]; humidity: Sample[];
    co2?: Sample[]; voc?: Sample[]; pressure?: Sample[];
  };
}

export const RANGE_MS: Record<string, number> = {
  '24h': 24 * 3600_000,
  '7d':  7 * 24 * 3600_000,
}

export interface MetricMeta {
  label: string; unit: string; fmt: (v: number) => string;
}

export const METRIC_META: Record<string, MetricMeta> = {
  temp:     { label: 'Temperature', unit: '°C', fmt: v => v.toFixed(1) },
  humidity: { label: 'Humidity',    unit: '%',  fmt: v => String(Math.round(v)) },
  co2:      { label: 'CO₂',         unit: 'ppm', fmt: v => String(Math.round(v)) },
  voc:      { label: 'VOC Index',   unit: 'idx', fmt: v => String(Math.round(v)) },
  pressure: { label: 'Pressure',    unit: 'hPa', fmt: v => String(Math.round(v)) },
}

export const DISPLAY_RANGES: Record<string, [number, number]> = {
  temp: [12, 26], humidity: [25, 75], co2: [400, 1000], voc: [0, 100], pressure: [1008, 1018],
}

export function latest(room: Room, key: string): number {
  const s = room.series[key as keyof typeof room.series]
  if (!s || s.length === 0) return 0
  return s[s.length - 1].v
}

export function sliceForRange(samples: Sample[], range: string): number[] {
  const ms = RANGE_MS[range]
  if (!ms) return samples.map(s => s.v)
  const cutoff = Date.now() - ms
  const out: number[] = []
  for (const s of samples) if (s.ts >= cutoff) out.push(s.v)
  return out
}

export function valuesOf(samples: Sample[] | undefined): number[] {
  return samples ? samples.map(s => s.v) : []
}

export function rangeTicks(range: string): string[] {
  switch (range) {
    case '1h':  return ['−60m','−45m','−30m','−15m','now']
    case '24h': return ['00:00','04:00','08:00','12:00','16:00','20:00']
    case '7d':  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    case '30d': return ['1','5','10','15','20','25','30']
    default:    return []
  }
}

export function toUnit(v: number, metric: string, units: 'C' | 'F'): number {
  if (metric === 'temp' && units === 'F') return v * 9/5 + 32
  return v
}

export function displayUnit(metric: string, units: 'C' | 'F'): string {
  if (metric === 'temp') return units === 'F' ? '°F' : '°C'
  return METRIC_META[metric]?.unit ?? ''
}

export function tone(metric: string, v: number): 'ok' | 'warn' | 'bad' {
  if (metric === 'co2') { if (v > 1000) return 'bad'; if (v > 800) return 'warn'; return 'ok' }
  if (metric === 'voc' && v > 100) return 'warn'
  if (metric === 'humidity' && (v < 30 || v > 65)) return 'warn'
  if (metric === 'temp' && (v < 17 || v > 26)) return 'warn'
  return 'ok'
}

export function subtextFor(metric: string, v: number): string {
  if (metric === 'temp') {
    if (v < 17) return 'cool · below comfort'
    if (v < 19) return 'cool'
    if (v <= 23) return 'comfortable'
    if (v <= 26) return 'warm'
    return 'hot'
  }
  if (metric === 'humidity') { if (v < 30) return 'dry'; if (v > 65) return 'humid'; return 'optimal range · 40–60' }
  if (metric === 'co2') { if (v > 1000) return 'stale · ventilate'; if (v > 800) return 'elevated'; return 'fresh air' }
  if (metric === 'voc') return v > 100 ? 'elevated' : 'normal'
  if (metric === 'pressure') return v > 1015 ? 'rising · fair' : v < 1010 ? 'falling · unsettled' : 'steady'
  return ''
}

export function deltaFor(room: Room, metric: string, units: 'C' | 'F'): string {
  const s = room.series[metric as keyof typeof room.series]
  if (!s || s.length < 2) return ''
  const last = s[s.length - 1]
  // Use the sample closest to 1h before the latest, fall back to first sample.
  const target = last.ts - 3600_000
  let baseline = s[0]
  for (let i = s.length - 2; i >= 0; i--) {
    if (s[i].ts <= target) { baseline = s[i]; break }
    baseline = s[i]
  }
  const d = last.v - baseline.v
  if (metric === 'temp') {
    const dD = units === 'F' ? d * 9/5 : d
    return `${dD >= 0 ? '+' : ''}${dD.toFixed(1)}° / 1h`
  }
  if (metric === 'humidity') return `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`
  if (metric === 'co2') return `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`
  if (metric === 'voc') return Math.abs(d) < 1 ? 'steady' : `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`
  if (metric === 'pressure') return `${d >= 0 ? '+' : ''}${d.toFixed(1)} / 1h`
  return ''
}

export function smoothPath(values: number[], w: number, h: number, padX = 0, padY = 0): string {
  if (values.length < 2) return ''
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const xs = values.map((_, i) => padX + (innerW * i) / (values.length - 1))
  const ys = values.map(v => padY + innerH * (1 - v))
  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i-1] + xs[i]) / 2
    d += ` C ${cx.toFixed(2)} ${ys[i-1].toFixed(2)}, ${cx.toFixed(2)} ${ys[i].toFixed(2)}, ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`
  }
  return d
}

export function normalize(values: number[], range?: [number, number]): number[] {
  let lo: number, hi: number
  if (range) { [lo, hi] = range }
  else {
    lo = Math.min(...values); hi = Math.max(...values)
    const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad
  }
  return values.map(v => (v - lo) / (hi - lo))
}
