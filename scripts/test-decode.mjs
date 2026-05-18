import { decodeFrames, preferDfe1 } from '../src/ruuvi/decode.ts'

// Captured 2026-05-17 from "RuuviAir 4603" — combined DF6+DFE1 (60 bytes)
const hex = '0611c239c4c42f000502331800ffff4ed0a64603e111c439a4c4320002000400060007022c1900ffffffffffff5e3440b8ffffffffffc2def0a64603'
const payload = Buffer.from(hex, 'hex')

console.log(`payload: ${payload.length} bytes`)
const frames = decodeFrames(payload)
console.log(`decoded ${frames.length} frame(s):\n`)
for (const f of frames) {
  console.log(`--- ${f.format} ---`)
  console.log(f)
  console.log()
}

const preferred = preferDfe1(frames)
console.log('=== preferred frame ===')
console.log(preferred)

// Sanity assertions against hand-decoded DFE1 values
const dfe1 = frames.find(f => f.format === 'DFE1')
if (!dfe1) throw new Error('no DFE1 frame')

const expect = (name, actual, expected, tol = 0.01) => {
  const ok = typeof expected === 'number'
    ? Math.abs(actual - expected) < tol
    : actual === expected
  console.log(`  ${ok ? '✓' : '✗'} ${name}: got ${actual}, expected ${expected}`)
  if (!ok) process.exitCode = 1
}

console.log('\n=== assertions ===')
expect('mac', dfe1.mac, 'C2:DE:F0:A6:46:03')
expect('temperature (°C)', dfe1.temperature, 22.74)
expect('humidity (%RH)', dfe1.humidity, 36.89)
expect('pressure (hPa)', dfe1.pressure, 1002.26)
expect('pm1 (µg/m³)', dfe1.pm1, 0.2)
expect('pm2.5', dfe1.pm25, 0.4)
expect('pm4', dfe1.pm4, 0.6)
expect('pm10', dfe1.pm10, 0.7)
expect('co2 (ppm)', dfe1.co2, 556)
expect('voc', dfe1.voc, 50)
expect('nox', dfe1.nox, 1)
expect('luminosity (null in dark)', dfe1.luminosity, null)
expect('sequence', dfe1.sequence, 6173760)
expect('calibration', dfe1.calibrationInProgress, false)
