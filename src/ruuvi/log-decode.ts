// Ruuvi Air GATT-log record decoder. 38 bytes per record, big-endian.
// NOTE: VOC/NOx are packed DIFFERENTLY here than in the DFE1 advertisement.
//   Advertisement DFE1:  voc = (byte17 << 1) | (flags_bit_6)        (hi-8 + lsb)
//   Log record:          voc = (flags_bit_6 << 8) | byte21          (msb + lo-8)
// We keep this decoder separate from the advertisement decoder for that reason.

export const LOG_RECORD_LEN = 38

export type LogRecord = {
  ts: number              // Unix seconds (in app clock frame after offset rewrite by sensor)
  format: number          // expected 0xE1
  temperature: number | null
  humidity: number | null
  pressure: number | null
  pm1: number | null
  pm25: number | null
  pm4: number | null
  pm10: number | null
  co2: number | null
  voc: number | null
  nox: number | null
  sequence: number
  calibrationInProgress: boolean
}

const i16 = (b: Buffer, o: number): number | null => {
  const v = b.readInt16BE(o)
  return v === -0x8000 ? null : v
}
const u16 = (b: Buffer, o: number): number | null => {
  const v = b.readUInt16BE(o)
  return v === 0xffff ? null : v
}

export function decodeLogRecord(b: Buffer): LogRecord {
  if (b.length < LOG_RECORD_LEN) throw new Error(`record too short: ${b.length}`)

  const flags = b[32]
  const vocLo = b[21]
  const noxLo = b[22]
  const voc9 = ((flags >> 6) & 1) << 8 | vocLo
  const nox9 = ((flags >> 7) & 1) << 8 | noxLo

  const pressureRaw = u16(b, 9)
  const tempRaw = i16(b, 5)
  const humRaw = u16(b, 7)
  const seq = (b[29] << 16) | (b[30] << 8) | b[31]

  return {
    ts: b.readUInt32BE(0),
    format: b[4],
    temperature: tempRaw === null ? null : tempRaw / 200,
    humidity: humRaw === null ? null : humRaw / 400,
    pressure: pressureRaw === null ? null : (pressureRaw + 50000) / 100,
    pm1: u16(b, 11) === null ? null : (u16(b, 11) as number) / 10,
    pm25: u16(b, 13) === null ? null : (u16(b, 13) as number) / 10,
    pm4: u16(b, 15) === null ? null : (u16(b, 15) as number) / 10,
    pm10: u16(b, 17) === null ? null : (u16(b, 17) as number) / 10,
    co2: u16(b, 19),
    voc: voc9 === 0x1ff ? null : voc9,
    nox: nox9 === 0x1ff ? null : nox9,
    sequence: seq === 0xffffff ? 0 : seq,
    calibrationInProgress: (flags & 1) === 1,
  }
}

// --- Protocol constants ---

// Noble wants lowercase no-dashes 32-char hex.
export const NUS = {
  SERVICE: '6e400001b5a3f393e0a9e50e24dcca9e',
  RX_WRITE: '6e400002b5a3f393e0a9e50e24dcca9e', // client -> sensor
  TX_NOTIFY: '6e400003b5a3f393e0a9e50e24dcca9e', // sensor -> client
}

export const AIR_LOG_OP_REQUEST = 0x21
export const AIR_LOG_OP_RESPONSE = 0x20
export const AIR_ENDPOINT = 0x3b

/** Build the 11-byte multi-record log-read command. */
export function buildLogReadCommand(startUnix = 0, nowUnix?: number): Buffer {
  const end = nowUnix ?? Math.floor(Date.now() / 1000)
  const buf = Buffer.alloc(11)
  buf[0] = AIR_ENDPOINT
  buf[1] = AIR_ENDPOINT
  buf[2] = AIR_LOG_OP_REQUEST
  buf.writeUInt32BE(end >>> 0, 3)
  buf.writeUInt32BE(startUnix >>> 0, 7)
  return buf
}

export type FramedPacket = {
  numRecords: number
  recordLength: number
  records: Buffer[]
}

const HEADER = Buffer.from([AIR_ENDPOINT, AIR_ENDPOINT, AIR_LOG_OP_RESPONSE])

/**
 * Stateful packet framer. Notifications can split/coalesce across BLE packets,
 * so we buffer bytes and pull out one full packet at a time on the
 * `3B 3B 20 <numRecords> <recordLength>` boundary.
 */
export class LogPacketFramer {
  private buf = Buffer.alloc(0)

  push(data: Buffer): FramedPacket[] {
    // Heartbeat / non-log frames start with 0x05 — skip.
    if (data.length > 0 && data[0] === 0x05) return []

    this.buf = Buffer.concat([this.buf, data])
    const out: FramedPacket[] = []

    while (true) {
      const pos = this.buf.indexOf(HEADER)
      if (pos === -1) {
        if (this.buf.length > 2) this.buf = this.buf.subarray(this.buf.length - 2)
        return out
      }
      if (pos > 0) this.buf = this.buf.subarray(pos)
      if (this.buf.length < 5) return out

      const numRecords = this.buf[3]
      const recordLength = this.buf[4]
      if (recordLength === 0 && numRecords !== 0) {
        // garbage; advance one byte and retry
        this.buf = this.buf.subarray(1)
        continue
      }
      const expected = 5 + numRecords * recordLength
      if (this.buf.length < expected) return out

      const records: Buffer[] = []
      for (let i = 0; i < numRecords; i++) {
        const start = 5 + i * recordLength
        records.push(Buffer.from(this.buf.subarray(start, start + recordLength)))
      }
      out.push({ numRecords, recordLength, records })
      this.buf = this.buf.subarray(expected)
    }
  }
}
