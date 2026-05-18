import {
  NUS, buildLogReadCommand, decodeLogRecord, LogPacketFramer, type LogRecord,
} from '../src/ruuvi/log-decode'

type Peripheral = any
type Characteristic = any

const COMPLETION_TIMEOUT_MS = 60000
const PROGRESS_QUIET_MS = 4000   // give up if no new packet for this long

export async function fetchAirHistory(
  peripheral: Peripheral,
  sinceUnix: number,
): Promise<LogRecord[]> {
  const id = peripheral.id
  const tag = `[log:${id.slice(-6)}]`
  console.log(`${tag} connecting…`)
  await peripheral.connectAsync()
  console.log(`${tag} connected (mtu=${peripheral.mtu ?? '?'}); discovering NUS…`)

  let rx: Characteristic | undefined, tx: Characteristic | undefined
  try {
    const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
      [NUS.SERVICE],
      [NUS.RX_WRITE, NUS.TX_NOTIFY],
    )
    rx = characteristics.find((c: Characteristic) => c.uuid === NUS.RX_WRITE)
    tx = characteristics.find((c: Characteristic) => c.uuid === NUS.TX_NOTIFY)
    if (!rx || !tx) {
      throw new Error(`missing NUS characteristics; got: ${characteristics.map((c: Characteristic) => c.uuid).join(', ')}`)
    }

    const framer = new LogPacketFramer()
    const records: LogRecord[] = []
    let done = false
    let lastDataAt = Date.now()

    const onData = (data: Buffer) => {
      lastDataAt = Date.now()
      const packets = framer.push(data)
      for (const pkt of packets) {
        if (pkt.numRecords === 0) { done = true; break }
        for (const rec of pkt.records) {
          try {
            records.push(decodeLogRecord(rec))
          } catch (e: any) {
            console.warn(`${tag} record decode error: ${e.message}`)
          }
        }
      }
    }
    tx.on('data', onData)
    await tx.subscribeAsync()

    const cmd = buildLogReadCommand(sinceUnix)
    console.log(`${tag} requesting logs since ${new Date(sinceUnix * 1000).toISOString()}`)
    await rx.writeAsync(cmd, false)

    const start = Date.now()
    while (!done) {
      if (Date.now() - start > COMPLETION_TIMEOUT_MS) {
        console.warn(`${tag} timeout; got ${records.length} records so far`)
        break
      }
      if (Date.now() - lastDataAt > PROGRESS_QUIET_MS && records.length > 0) {
        console.warn(`${tag} quiet ${PROGRESS_QUIET_MS}ms; assuming done with ${records.length} records`)
        break
      }
      await new Promise(r => setTimeout(r, 250))
    }

    tx.removeListener('data', onData)
    try { await tx.unsubscribeAsync() } catch {}

    console.log(`${tag} fetched ${records.length} records`)
    return records
  } finally {
    try { await peripheral.disconnectAsync() } catch {}
  }
}
