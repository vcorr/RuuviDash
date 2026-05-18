export const RUUVI_COMPANY_ID = 0x0499

export type RuuviSample = {
  format: 'DF6' | 'DFE1'
  mac: string
  temperature: number | null
  humidity: number | null
  pressure: number | null
  co2: number | null
  voc: number | null
  nox: number | null
  pm1: number | null
  pm25: number | null
  pm4: number | null
  pm10: number | null
  luminosity: number | null
  sequence: number
  calibrationInProgress: boolean
}

const FRAME_LEN: Record<number, number> = { 0x06: 20, 0xe1: 40 }

const macToString = (b: Buffer): string =>
  Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(':').toUpperCase()

const i16 = (b: Buffer, o: number, sentinel = 0x8000): number | null => {
  const v = b.readInt16BE(o)
  return v === -0x8000 && sentinel === 0x8000 ? null : v
}
const u16 = (b: Buffer, o: number, sentinel = 0xffff): number | null => {
  const v = b.readUInt16BE(o)
  return v === sentinel ? null : v
}
const u24 = (b: Buffer, o: number, sentinel = 0xffffff): number | null => {
  const v = (b[o] << 16) | (b[o + 1] << 8) | b[o + 2]
  return v === sentinel ? null : v
}

function decodeDf6(b: Buffer): RuuviSample {
  const flags = b[16]
  const vocHi = b[11]
  const noxHi = b[12]
  const voc9 = (vocHi << 1) | ((flags >> 6) & 1)
  const nox9 = (noxHi << 1) | ((flags >> 7) & 1)
  const lumCode = b[13]
  let luminosity: number | null
  if (lumCode === 0xff) luminosity = null
  else if (lumCode === 0) luminosity = 0
  else luminosity = Math.exp(lumCode * (Math.log(65536) / 254)) - 1

  const pressureRaw = u16(b, 5)

  return {
    format: 'DF6',
    mac: macToString(b.subarray(17, 20)),
    temperature: i16(b, 1) === null ? null : (i16(b, 1) as number) * 0.005,
    humidity: u16(b, 3) === null ? null : (u16(b, 3) as number) * 0.0025,
    pressure: pressureRaw === null ? null : (pressureRaw + 50000) / 100,
    pm1: null,
    pm25: u16(b, 7) === null ? null : (u16(b, 7) as number) * 0.1,
    pm4: null,
    pm10: null,
    co2: u16(b, 9),
    voc: voc9 === 0x1ff ? null : voc9,
    nox: nox9 === 0x1ff ? null : nox9,
    luminosity,
    sequence: b[15],
    calibrationInProgress: (flags & 1) === 1,
  }
}

function decodeDfe1(b: Buffer): RuuviSample {
  const flags = b[28]
  const vocHi = b[17]
  const noxHi = b[18]
  const voc9 = (vocHi << 1) | ((flags >> 6) & 1)
  const nox9 = (noxHi << 1) | ((flags >> 7) & 1)
  const lumRaw = u24(b, 19)
  const pressureRaw = u16(b, 5)

  return {
    format: 'DFE1',
    mac: macToString(b.subarray(34, 40)),
    temperature: i16(b, 1) === null ? null : (i16(b, 1) as number) * 0.005,
    humidity: u16(b, 3) === null ? null : (u16(b, 3) as number) * 0.0025,
    pressure: pressureRaw === null ? null : (pressureRaw + 50000) / 100,
    pm1: u16(b, 7) === null ? null : (u16(b, 7) as number) * 0.1,
    pm25: u16(b, 9) === null ? null : (u16(b, 9) as number) * 0.1,
    pm4: u16(b, 11) === null ? null : (u16(b, 11) as number) * 0.1,
    pm10: u16(b, 13) === null ? null : (u16(b, 13) as number) * 0.1,
    co2: u16(b, 15),
    voc: voc9 === 0x1ff ? null : voc9,
    nox: nox9 === 0x1ff ? null : nox9,
    luminosity: lumRaw === null ? null : lumRaw * 0.01,
    sequence: u24(b, 25) ?? 0,
    calibrationInProgress: (flags & 1) === 1,
  }
}

export function decodeFrames(payload: Buffer): RuuviSample[] {
  const out: RuuviSample[] = []
  let o = 0
  while (o < payload.length) {
    const fmt = payload[o]
    const len = FRAME_LEN[fmt]
    if (!len || o + len > payload.length) break
    const frame = payload.subarray(o, o + len)
    if (fmt === 0x06) out.push(decodeDf6(frame))
    else if (fmt === 0xe1) out.push(decodeDfe1(frame))
    o += len
  }
  return out
}

export function decodeManufacturerData(md: Buffer): RuuviSample[] | null {
  if (md.length < 2) return null
  if (md.readUInt16LE(0) !== RUUVI_COMPANY_ID) return null
  return decodeFrames(md.subarray(2))
}

export function preferDfe1(samples: RuuviSample[]): RuuviSample | null {
  if (samples.length === 0) return null
  return samples.find(s => s.format === 'DFE1') ?? samples[0]
}
