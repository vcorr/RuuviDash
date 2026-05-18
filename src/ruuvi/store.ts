import { useEffect, useSyncExternalStore } from 'react'
import type { Room, RoomKind } from '../data'
import type { Sample, SensorReading, HistoryBatch, SyncStatus } from './types'

const RETAIN_MS = 7 * 24 * 3600_000      // keep 7 days of history
const RETAIN_HEADROOM = 6 * 3600_000     // grace period before pruning

type Series = { temp: Sample[]; humidity: Sample[]; co2: Sample[]; voc: Sample[]; pressure: Sample[] }

type Row = { reading: SensorReading; series: Series }

const sensors = new Map<string, Row>()
const listeners = new Set<() => void>()
let snapshot: Room[] = []
let syncStatus: SyncStatus = { status: 'idle' }

const emptySeries = (): Series => ({ temp: [], humidity: [], co2: [], voc: [], pressure: [] })

const append = (arr: Sample[], v: number | null, ts: number): Sample[] => {
  if (v === null) return arr
  if (arr.length > 0 && arr[arr.length - 1].ts >= ts) return arr   // out-of-order; drop
  return [...arr, { ts, v }]
}

/** Merge a batch of historical samples into an existing series.
 * Both arrays are sorted by ts ascending. Skip points whose ts is within ±30s
 * of an existing point (dedup vs. live broadcasts that overlap with the
 * historical buffer). */
const mergeHistory = (existing: Sample[], incoming: Sample[]): Sample[] => {
  if (incoming.length === 0) return existing
  const all = [...existing, ...incoming].sort((a, b) => a.ts - b.ts)
  const out: Sample[] = []
  const DEDUP_MS = 30_000
  for (const s of all) {
    const prev = out[out.length - 1]
    if (prev && s.ts - prev.ts < DEDUP_MS) continue
    out.push(s)
  }
  const cutoff = Date.now() - (RETAIN_MS + RETAIN_HEADROOM)
  while (out.length > 0 && out[0].ts < cutoff) out.shift()
  return out
}

const friendlyName = (r: SensorReading): string =>
  r.localName ?? `Sensor ${r.mac.split(':').slice(-2).join('')}`

const kindFor = (r: SensorReading): RoomKind => (r.co2 != null || r.format === 'DFE1' ? 'AIR' : 'Temp')

const recomputeSnapshot = () => {
  snapshot = Array.from(sensors.values()).map(({ reading, series }) => ({
    id: reading.mac,
    name: friendlyName(reading),
    kind: kindFor(reading),
    mac: reading.mac,
    battery: 100,
    signal: reading.rssi,
    fw: '—',
    series: kindFor(reading) === 'AIR'
      ? { temp: series.temp, humidity: series.humidity, co2: series.co2, voc: series.voc }
      : { temp: series.temp, humidity: series.humidity, pressure: series.pressure },
  }))
}

const notify = () => { for (const l of listeners) l() }

const ingestSample = (r: SensorReading) => {
  const key = r.mac
  const prev = sensors.get(key)
  const base = prev?.series ?? emptySeries()
  const series: Series = {
    temp: append(base.temp, r.temperature, r.ts),
    humidity: append(base.humidity, r.humidity, r.ts),
    co2: append(base.co2, r.co2, r.ts),
    voc: append(base.voc, r.voc, r.ts),
    pressure: append(base.pressure, r.pressure, r.ts),
  }
  const reading = prev?.reading.localName && !r.localName
    ? { ...r, localName: prev.reading.localName }
    : r
  sensors.set(key, { reading, series })
  recomputeSnapshot()
  notify()
}

const ingestHistory = (batch: HistoryBatch) => {
  const prev = sensors.get(batch.mac)
  const base = prev?.series ?? emptySeries()

  const toSamples = (pick: (r: HistoryBatch['records'][number]) => number | null): Sample[] => {
    const out: Sample[] = []
    for (const r of batch.records) {
      const v = pick(r)
      if (v == null) continue
      out.push({ ts: r.ts * 1000, v })
    }
    return out.sort((a, b) => a.ts - b.ts)
  }

  const series: Series = {
    temp: mergeHistory(base.temp, toSamples(r => r.temperature)),
    humidity: mergeHistory(base.humidity, toSamples(r => r.humidity)),
    co2: mergeHistory(base.co2, toSamples(r => r.co2)),
    voc: mergeHistory(base.voc, toSamples(r => r.voc)),
    pressure: mergeHistory(base.pressure, toSamples(r => r.pressure)),
  }

  if (prev) {
    sensors.set(batch.mac, { reading: prev.reading, series })
  } else {
    // History arrived before any live sample — synthesize a placeholder reading.
    const synth: SensorReading = {
      format: 'DFE1',
      mac: batch.mac,
      temperature: null, humidity: null, pressure: null, co2: null, voc: null,
      nox: null, pm1: null, pm25: null, pm4: null, pm10: null,
      luminosity: null, sequence: 0, calibrationInProgress: false,
      ts: Date.now(), rssi: -100, peripheralId: batch.mac,
    }
    sensors.set(batch.mac, { reading: synth, series })
  }
  recomputeSnapshot()
  notify()
}

const setSyncStatus = (s: SyncStatus) => {
  syncStatus = s
  notify()
}

let wired = false
const wire = () => {
  if (wired) return
  const w = window as any
  if (!w.api?.ruuvi) return
  w.api.ruuvi.onSample?.(ingestSample)
  w.api.ruuvi.onHistory?.(ingestHistory)
  w.api.ruuvi.onSyncStatus?.(setSyncStatus)
  wired = true
}

const subscribe = (cb: () => void) => {
  wire()
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function useLiveRooms(): Room[] {
  useEffect(wire, [])
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

export function useSyncStatus(): SyncStatus {
  useEffect(wire, [])
  return useSyncExternalStore(subscribe, () => syncStatus, () => syncStatus)
}
