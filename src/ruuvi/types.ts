import type { RuuviSample } from './decode'

export type SensorReading = RuuviSample & {
  ts: number
  rssi: number
  peripheralId: string
  localName?: string
}

export type Sample = { ts: number; v: number }

export type HistoryRecord = {
  ts: number              // Unix seconds
  temperature: number | null
  humidity: number | null
  pressure: number | null
  co2: number | null
  voc: number | null
}

export type HistoryBatch = {
  mac: string
  records: HistoryRecord[]
}

export type SyncStatus =
  | { status: 'idle' }
  | { status: 'syncing'; mac: string }
  | { status: 'error'; mac: string; message: string }
