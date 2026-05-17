import React from 'react'
import { useTheme } from '../context'
import type { Room } from '../data'
import styles from './Header.module.css'

export default function Header({ room }: { room: Room }) {
  const { a } = useTheme()
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.eyebrow}>RUUVI · {room.kind.toUpperCase()} · ID {room.mac}</div>
        <h1 className={styles.title}>{room.name}</h1>
      </div>
      <div className={styles.metaRow}>
        <MetaCell label="LAST" value="12 SEC" />
        <MetaCell label="BATTERY" value={`${room.battery}%`} barPct={room.battery} accentHex={a.hex} />
        <MetaCell label="RSSI" value={`${room.signal} dBm`} />
        <MetaCell label="FW" value={room.fw} />
      </div>
    </header>
  )
}

function MetaCell({ label, value, barPct, accentHex }: { label: string; value: string; barPct?: number; accentHex?: string }) {
  return (
    <div className={styles.metaCell}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
      {barPct !== undefined && (
        <div className={styles.battBar}>
          <div className={styles.battFill} style={{ width: `${barPct}%`, background: accentHex }} />
        </div>
      )}
    </div>
  )
}
