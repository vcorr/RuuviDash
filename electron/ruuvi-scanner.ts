import noble from '@abandonware/noble'
import { decodeManufacturerData, preferDfe1 } from '../src/ruuvi/decode'
import type { SensorReading, HistoryBatch, SyncStatus } from '../src/ruuvi/types'
import { fetchAirHistory } from './ruuvi-log-fetch'

type Handlers = {
  onSample: (r: SensorReading) => void
  onHistory: (h: HistoryBatch) => void
  onSyncStatus: (s: SyncStatus) => void
}

const HISTORY_DAYS = 7

export function startRuuviScanner(h: Handlers) {
  let scanning = false
  let busy = false
  const fetchedMacs = new Set<string>()

  const ensureScan = async (state: string) => {
    console.log(`[ruuvi] BT state: ${state}`)
    if (state === 'poweredOn' && !scanning && !busy) {
      scanning = true
      await noble.startScanningAsync([], true)
      console.log('[ruuvi] scanning…')
    } else if (state !== 'poweredOn' && scanning) {
      scanning = false
      try { await noble.stopScanningAsync() } catch {}
    }
  }

  const onDiscover = async (peripheral: any) => {
    const md = peripheral.advertisement?.manufacturerData
    if (!md) return
    const frames = decodeManufacturerData(md)
    if (!frames || frames.length === 0) return
    const best = preferDfe1(frames)
    if (!best) return

    h.onSample({
      ...best,
      ts: Date.now(),
      rssi: peripheral.rssi,
      peripheralId: peripheral.id,
      localName: peripheral.advertisement?.localName,
    })

    if (!fetchedMacs.has(best.mac) && !busy) {
      fetchedMacs.add(best.mac)
      busy = true
      const since = Math.floor(Date.now() / 1000) - HISTORY_DAYS * 86400
      try {
        if (scanning) { try { await noble.stopScanningAsync() } catch {}; scanning = false }
        h.onSyncStatus({ status: 'syncing', mac: best.mac })
        const records = await fetchAirHistory(peripheral, since)
        h.onHistory({
          mac: best.mac,
          records: records.map(r => ({
            ts: r.ts,
            temperature: r.temperature,
            humidity: r.humidity,
            pressure: r.pressure,
            co2: r.co2,
            voc: r.voc,
          })),
        })
        h.onSyncStatus({ status: 'idle' })
      } catch (e: any) {
        console.error(`[ruuvi] history fetch failed for ${best.mac}: ${e.message}`)
        h.onSyncStatus({ status: 'error', mac: best.mac, message: e.message })
        fetchedMacs.delete(best.mac) // allow retry on next discovery
      } finally {
        busy = false
        try { await noble.startScanningAsync([], true); scanning = true } catch {}
      }
    }
  }

  noble.on('stateChange', ensureScan)
  noble.on('discover', onDiscover)
  if (noble.state === 'poweredOn') void ensureScan('poweredOn')

  return {
    stop: async () => {
      noble.off('stateChange', ensureScan)
      noble.off('discover', onDiscover)
      if (scanning) { try { await noble.stopScanningAsync() } catch {} }
    },
  }
}
