import React from 'react'
import { useTheme } from '../context'
import { latest, tone, toUnit, type Room } from '../data'
import styles from './Sidebar.module.css'

interface Props {
  rooms: Room[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function Sidebar({ rooms, selectedId, onSelect }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.locLabel}>LOCATIONS</span>
        <span className={styles.locCount}>{rooms.length}</span>
      </div>
      <div className={styles.list}>
        {rooms.map(room => (
          <RoomCard key={room.id} room={room} selected={room.id === selectedId} onClick={() => onSelect(room.id)} />
        ))}
      </div>
      <button className={styles.pairBtn}>+ Pair sensor</button>
      <div className={styles.footer}>
        <FooterRow label="HUB" value="online · 192.168.1.42" />
        <FooterRow label="GATEWAY" value="ble · 2 dropped/24h" />
      </div>
    </aside>
  )
}

function FooterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.footerRow}>
      <span className={styles.footerLabel}>{label}</span>
      <span className={styles.footerValue}>{value}</span>
    </div>
  )
}

interface CardProps { room: Room; selected: boolean; onClick: () => void }

function RoomCard({ room, selected, onClick }: CardProps) {
  const { units } = useTheme()
  const isAir = room.kind === 'AIR'

  const tempC = latest(room, 'temp')
  const tempD = toUnit(tempC, 'temp', units)
  const hum = latest(room, 'humidity')
  const co2 = latest(room, 'co2')
  const pressure = latest(room, 'pressure')
  const co2Warn = isAir && tone('co2', co2) !== 'ok'

  return (
    <button
      onClick={onClick}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
    >
      {selected && <div className={styles.accentRail} />}
      <div className={styles.cardTop}>
        <div className={styles.cardLeft}>
          <div className={styles.dot} style={{ background: isAir ? 'var(--accent)' : 'var(--muted)' }} />
          <span className={`${styles.cardName} ${selected ? styles.cardNameSelected : ''}`}>{room.name}</span>
        </div>
        <span className={styles.kindTag}>{room.kind.toUpperCase()}</span>
      </div>
      <div className={styles.readings}>
        <span className={styles.readingTemp}>{tempD.toFixed(1)}°</span>
        <span className={styles.readingMuted}>{Math.round(hum)}%rh</span>
        {isAir
          ? <span style={{ color: co2Warn ? 'var(--warn)' : 'var(--muted)' }}>{Math.round(co2)}ppm</span>
          : <span className={styles.readingMuted}>{Math.round(pressure)}hPa</span>
        }
      </div>
    </button>
  )
}
