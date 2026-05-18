import { contextBridge, ipcRenderer } from 'electron'
import type { SensorReading, HistoryBatch, SyncStatus } from '../src/ruuvi/types'

contextBridge.exposeInMainWorld('api', {
  send: (channel: string) => ipcRenderer.send(channel),
  ruuvi: {
    onSample: (cb: (r: SensorReading) => void) => {
      const h = (_e: unknown, x: SensorReading) => cb(x)
      ipcRenderer.on('ruuvi:sample', h)
      return () => { ipcRenderer.off('ruuvi:sample', h) }
    },
    onHistory: (cb: (b: HistoryBatch) => void) => {
      const h = (_e: unknown, x: HistoryBatch) => cb(x)
      ipcRenderer.on('ruuvi:history', h)
      return () => { ipcRenderer.off('ruuvi:history', h) }
    },
    onSyncStatus: (cb: (s: SyncStatus) => void) => {
      const h = (_e: unknown, x: SyncStatus) => cb(x)
      ipcRenderer.on('ruuvi:sync', h)
      return () => { ipcRenderer.off('ruuvi:sync', h) }
    },
  },
})
