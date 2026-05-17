export type RoomKind = 'AIR' | 'Temp'

export interface Room {
  id: string; name: string; kind: RoomKind;
  mac: string; battery: number; signal: number; fw: string;
  series: {
    temp: number[]; humidity: number[];
    co2?: number[]; voc?: number[]; pressure?: number[];
  };
}

export interface MetricMeta {
  label: string; unit: string; fmt: (v: number) => string;
}

const BASE = {
  temp:     [20.1,19.8,19.6,19.4,19.3,19.2,19.4,19.9,20.5,21.0,21.4,21.8,22.0,22.1,21.9,21.7,21.5,21.4,21.6,21.8,21.7,21.4,21.0,20.6],
  humidity: [52,53,54,55,55,56,56,55,53,51,49,48,47,47,46,46,47,48,49,51,52,51,50,49],
  co2:      [480,470,460,455,450,450,470,540,640,720,780,810,820,800,760,720,690,720,790,860,910,830,720,610],
  voc:      [18,17,17,16,16,16,17,19,21,22,23,24,24,23,22,21,22,24,32,38,31,26,22,20],
  pressure: [1013,1013,1013,1013,1013,1013,1014,1014,1014,1014,1014,1014,1014,1014,1013,1013,1013,1013,1013,1013,1013,1013,1013,1013],
}

function shape(arr: number[], offset: number, scale = 1): number[] {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return arr.map(v => mean + offset + (v - mean) * scale)
}

export const ROOMS: Room[] = [
  { id: 'living', name: 'Living Room', kind: 'AIR', battery: 92, signal: -54, fw: '3.31.1', mac: '8F:2C:91',
    series: { temp: shape(BASE.temp,0,1), humidity: shape(BASE.humidity,-4,0.9), co2: shape(BASE.co2,0,1), voc: shape(BASE.voc,0,1) } },
  { id: 'bedroom', name: 'Bedroom', kind: 'Temp', battery: 78, signal: -61, fw: '3.31.1', mac: 'A2:4B:14',
    series: { temp: shape(BASE.temp,-2.2,0.7), humidity: shape(BASE.humidity,6,0.6), pressure: shape(BASE.pressure,0,1) } },
  { id: 'office', name: 'Office', kind: 'Temp', battery: 64, signal: -68, fw: '3.31.1', mac: 'C8:71:E3',
    series: { temp: shape(BASE.temp,0.6,1.1), humidity: shape(BASE.humidity,-7,1.0), pressure: shape(BASE.pressure,0.5,1) } },
  { id: 'balcony', name: 'Balcony', kind: 'Temp', battery: 58, signal: -77, fw: '3.31.1', mac: 'D1:09:5A',
    series: { temp: shape(BASE.temp,-12,2.6), humidity: shape(BASE.humidity,20,1.4), pressure: shape(BASE.pressure,-1.5,1.4) } },
]

export const METRIC_META: Record<string, MetricMeta> = {
  temp:     { label: 'Temperature', unit: '°C', fmt: v => v.toFixed(1) },
  humidity: { label: 'Humidity',    unit: '%',  fmt: v => String(Math.round(v)) },
  co2:      { label: 'CO₂',         unit: 'ppm', fmt: v => String(Math.round(v)) },
  voc:      { label: 'VOC Index',   unit: 'idx', fmt: v => String(Math.round(v)) },
  pressure: { label: 'Pressure',    unit: 'hPa', fmt: v => String(Math.round(v)) },
}

export const DISPLAY_RANGES: Record<string, [number, number]> = {
  temp: [12, 26], humidity: [25, 75], co2: [400, 1000], voc: [10, 45], pressure: [1008, 1018],
}

export function latest(room: Room, key: string): number {
  const s = room.series[key as keyof typeof room.series]
  if (!s || s.length === 0) return 0
  return s[s.length - 1]
}

export function sliceForRange(values: number[], range: string): number[] {
  switch (range) {
    case '1h':  return values.slice(-2)
    case '24h': return values.slice()
    case '7d':  return tile(values, 7)
    case '30d': return tile(values, 30)
    default:    return values.slice()
  }
}

function tile(values: number[], days: number): number[] {
  const samples = days * 8
  const out = new Array(samples)
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * 24
    const idx = Math.floor(t) % values.length
    const next = (idx + 1) % values.length
    const frac = t - Math.floor(t)
    const drift = Math.sin((i / samples) * Math.PI * 4) * 0.6
    out[i] = values[idx] * (1 - frac) + values[next] * frac + drift
  }
  return out
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
  const d = s[s.length - 1] - s[s.length - 2]
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
