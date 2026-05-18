import noble from '@abandonware/noble'

const RUUVI_COMPANY_ID = 0x0499
const SCAN_MS = Number(process.env.SCAN_MS ?? 15000)

const seen = new Map()

setTimeout(async () => {
  console.log(`\n[scan] ${SCAN_MS}ms elapsed, stopping`)
  await noble.stopScanningAsync()
  console.log(`[scan] saw ${seen.size} Ruuvi peripheral(s)`)
  process.exit(0)
}, SCAN_MS)

noble.on('stateChange', async (state) => {
  console.log(`[state] ${state}`)
  if (state === 'poweredOn') {
    console.log('[scan] starting — Ctrl-C to stop')
    await noble.startScanningAsync([], true)
  } else {
    await noble.stopScanningAsync()
  }
})

noble.on('discover', (peripheral) => {
  const md = peripheral.advertisement?.manufacturerData
  if (!md || md.length < 2) return

  const companyId = md.readUInt16LE(0)
  if (companyId !== RUUVI_COMPANY_ID) return

  const payload = md.subarray(2)
  const formatByte = payload[0]
  const id = peripheral.id
  const prev = seen.get(id)
  seen.set(id, Date.now())

  const firstSighting = !prev
  const tag = firstSighting ? 'NEW' : 'upd'

  console.log(
    `[${tag}] ${peripheral.address || id}  rssi=${peripheral.rssi}  ` +
    `fmt=0x${formatByte.toString(16).padStart(2, '0')}  ` +
    `len=${payload.length}  ` +
    `payload=${payload.toString('hex')}`
  )

  if (firstSighting && peripheral.advertisement?.localName) {
    console.log(`       name="${peripheral.advertisement.localName}"`)
  }
})

process.on('SIGINT', async () => {
  console.log('\n[scan] stopping')
  await noble.stopScanningAsync()
  console.log(`[scan] saw ${seen.size} Ruuvi peripheral(s)`)
  process.exit(0)
})
