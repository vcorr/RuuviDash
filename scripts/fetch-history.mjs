import noble from '@abandonware/noble'
import {
  NUS, buildLogReadCommand, decodeLogRecord, LogPacketFramer, LOG_RECORD_LEN,
} from '../src/ruuvi/log-decode.ts'

const RUUVI_COMPANY_ID = 0x0499
const TARGET_MAC = process.env.RUUVI_MAC?.toUpperCase() // optional filter, e.g. "C2:DE:F0:A6:46:03"
const DAYS = Number(process.env.DAYS ?? 7)
const SINCE_UNIX = process.env.SINCE != null
  ? Number(process.env.SINCE)
  : Math.floor(Date.now() / 1000) - DAYS * 86400
const DISCOVERY_TIMEOUT_MS = 10000
const COMPLETION_TIMEOUT_MS = 60000

const log = (...a) => console.log(...a)

function macFromManufacturerData(md) {
  if (!md || md.length < 2 || md.readUInt16LE(0) !== RUUVI_COMPANY_ID) return null
  // Both DF6 and DFE1 carry the MAC; sniff from DFE1 first (full 6 bytes), then DF6 (low 3).
  const payload = md.subarray(2)
  let o = 0
  while (o < payload.length) {
    const fmt = payload[o]
    if (fmt === 0xe1 && o + 40 <= payload.length) {
      const m = payload.subarray(o + 34, o + 40)
      return Array.from(m).map(x => x.toString(16).padStart(2, '0')).join(':').toUpperCase()
    }
    if (fmt === 0x06 && o + 20 <= payload.length) {
      const m = payload.subarray(o + 17, o + 20)
      return ':XX:XX:XX:' + Array.from(m).map(x => x.toString(16).padStart(2, '0')).join(':').toUpperCase()
    }
    if (fmt === 0xe1) o += 40
    else if (fmt === 0x06) o += 20
    else break
  }
  return null
}

async function fetchHistory(peripheral) {
  log(`[fetch] connecting to ${peripheral.id} (${peripheral.advertisement?.localName ?? '?'})…`)
  await peripheral.connectAsync()
  log('[fetch] connected; discovering NUS service & characteristics…')

  const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
    [NUS.SERVICE],
    [NUS.RX_WRITE, NUS.TX_NOTIFY],
  )
  const rx = characteristics.find(c => c.uuid === NUS.RX_WRITE)
  const tx = characteristics.find(c => c.uuid === NUS.TX_NOTIFY)
  if (!rx || !tx) throw new Error(`missing NUS characteristics; got: ${characteristics.map(c => c.uuid).join(', ')}`)

  log(`[fetch] mtu = ${peripheral.mtu ?? '(default)'} ; subscribing to TX…`)
  await tx.subscribeAsync()

  const framer = new LogPacketFramer()
  let done = false
  let recordsTotal = 0
  let packetsTotal = 0
  const allRecords = []

  const onData = (data) => {
    packetsTotal++
    const packets = framer.push(data)
    for (const pkt of packets) {
      if (pkt.numRecords === 0) {
        log(`[fetch] EOF packet received`)
        done = true
        break
      }
      for (const rec of pkt.records) {
        try {
          const r = decodeLogRecord(rec)
          allRecords.push(r)
          recordsTotal++
        } catch (e) {
          log(`[fetch] decode error: ${e.message}; raw=${rec.toString('hex')}`)
        }
      }
    }
  }
  tx.on('data', onData)

  const cmd = buildLogReadCommand(SINCE_UNIX)
  log(`[fetch] writing command: ${cmd.toString('hex')} (since=${SINCE_UNIX})`)
  await rx.writeAsync(cmd, false)

  const start = Date.now()
  while (!done && Date.now() - start < COMPLETION_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, 250))
  }
  if (!done) log(`[fetch] timeout after ${COMPLETION_TIMEOUT_MS}ms; got ${recordsTotal} records`)

  tx.removeListener('data', onData)
  try { await tx.unsubscribeAsync() } catch {}
  try { await peripheral.disconnectAsync() } catch {}

  log(`[fetch] done: ${recordsTotal} records across ${packetsTotal} BLE packets`)
  if (allRecords.length > 0) {
    const first = allRecords[0], last = allRecords[allRecords.length - 1]
    log(`[fetch] first record: ts=${new Date(first.ts * 1000).toISOString()} temp=${first.temperature}°C hum=${first.humidity}% co2=${first.co2}ppm`)
    log(`[fetch] last  record: ts=${new Date(last.ts * 1000).toISOString()} temp=${last.temperature}°C hum=${last.humidity}% co2=${last.co2}ppm`)
    const temps = allRecords.map(r => r.temperature).filter(v => v != null)
    log(`[fetch] temp stats: min=${Math.min(...temps).toFixed(2)}°C max=${Math.max(...temps).toFixed(2)}°C avg=${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2)}°C`)
    log(`[fetch] span: ${((last.ts - first.ts) / 86400).toFixed(2)} days`)
  }
  return allRecords
}

let connecting = false

noble.on('stateChange', async (state) => {
  log(`[state] ${state}`)
  if (state === 'poweredOn') {
    await noble.startScanningAsync([], true)
  }
})

noble.on('discover', async (peripheral) => {
  if (connecting) return
  const mac = macFromManufacturerData(peripheral.advertisement?.manufacturerData)
  if (!mac) return
  if (TARGET_MAC && !mac.endsWith(TARGET_MAC.slice(-8))) return

  log(`[discover] Ruuvi at ${mac} (peripheral.id=${peripheral.id}, rssi=${peripheral.rssi})`)
  connecting = true
  await noble.stopScanningAsync()

  try {
    await fetchHistory(peripheral)
  } catch (e) {
    log(`[fetch] ERROR: ${e.message}`)
    console.error(e)
  }
  process.exit(0)
})

setTimeout(() => {
  log(`[scan] discovery timeout (${DISCOVERY_TIMEOUT_MS}ms) — no Ruuvi found`)
  process.exit(1)
}, DISCOVERY_TIMEOUT_MS)
