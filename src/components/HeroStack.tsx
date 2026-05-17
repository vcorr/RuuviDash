import React from 'react'
import { useTheme } from '../context'
import { latest, tone, subtextFor, deltaFor, toUnit, displayUnit, normalize, smoothPath, METRIC_META, type Room } from '../data'
import styles from './HeroStack.module.css'

const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace'

export default function HeroStack({ room }: { room: Room }) {
  const isAir = room.kind === 'AIR'
  const metrics = isAir
    ? [{ key: 'temp', label: 'TEMPERATURE', big: true }, { key: 'humidity', label: 'HUMIDITY', big: false },
       { key: 'co2', label: 'CO₂', big: false }, { key: 'voc', label: 'VOC INDEX', big: false }]
    : [{ key: 'temp', label: 'TEMPERATURE', big: true }, { key: 'humidity', label: 'HUMIDITY', big: false },
       { key: 'pressure', label: 'PRESSURE', big: false }, { key: '_comfort', label: 'COMFORT', big: false }]

  return (
    <div className={styles.stack}>
      {metrics.map(m => (
        m.key === '_comfort'
          ? <ComfortTile key="_comfort" room={room} />
          : <HeroTile key={m.key} room={room} metric={m.key} label={m.label} big={m.big} />
      ))}
    </div>
  )
}

function HeroTile({ room, metric, label, big }: { room: Room; metric: string; label: string; big: boolean }) {
  const theme = useTheme()
  const { p, a, units } = theme
  const val = latest(room, metric)
  const t = tone(metric, val)
  const isWarn = t !== 'ok'
  const displayVal = metric === 'temp' ? toUnit(val, 'temp', units).toFixed(1) : METRIC_META[metric].fmt(val)
  const unit = displayUnit(metric, units)
  const sub = subtextFor(metric, val)
  const delta = deltaFor(room, metric, units)
  const seriesRaw = (room.series as Record<string, number[]>)[metric] as number[] | undefined

  const valueColor = isWarn ? 'var(--warn)' : (big ? 'var(--accent)' : 'var(--ink)')
  const sparkColor = isWarn ? p.warnHex : (big ? a.hex : p.muted)
  const deltaColor = isWarn ? 'var(--warn)' : 'var(--muted)'

  return (
    <div className={`${styles.tile} ${big ? styles.tileBig : styles.tileSmall}`}>
      <div className={styles.tileLeft}>
        <div className={styles.tileLabel}>{label}</div>
        <div className={styles.tileValueRow}>
          <span className={big ? styles.valueBig : styles.valueSmall} style={{ color: valueColor }}>{displayVal}</span>
          <span className={styles.unit}>{unit}</span>
        </div>
        <div className={styles.sub}>{sub}</div>
      </div>
      <div className={styles.tileRight}>
        {seriesRaw && <Sparkline values={seriesRaw} color={sparkColor} />}
        <span className={styles.delta} style={{ color: deltaColor, fontFamily: MONO }}>{delta}</span>
      </div>
    </div>
  )
}

function ComfortTile({ room }: { room: Room }) {
  const { a } = useTheme()
  const temp = latest(room, 'temp')
  const hum = latest(room, 'humidity')
  const tempScore = 1 - Math.min(1, Math.abs(temp - 21) / 6)
  const humScore = 1 - Math.min(1, Math.abs(hum - 50) / 25)
  const score = Math.round((tempScore + humScore) / 2 * 100)
  const label = score >= 75 ? 'pleasant' : score >= 50 ? 'acceptable' : score >= 25 ? 'uncomfortable' : 'poor'

  return (
    <div className={`${styles.tile} ${styles.tileSmall}`}>
      <div className={styles.tileLeft}>
        <div className={styles.tileLabel}>COMFORT</div>
        <div className={styles.tileValueRow}>
          <span className={styles.valueSmall} style={{ color: 'var(--ink)' }}>{score}</span>
          <span className={styles.unit}>/ 100</span>
        </div>
        <div className={styles.sub}>{label}</div>
      </div>
      <div className={styles.tileRight}>
        <div className={styles.comfortBarWrap}>
          <div className={styles.comfortBarTrack}>
            <div className={styles.comfortBarFill} style={{ width: `${score}%`, background: a.hex }} />
          </div>
          <div className={styles.comfortLabels}>
            <span>POOR</span><span>OK</span><span>GOOD</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 96, H = 28
  const norm = normalize(values)
  const d = smoothPath(norm, W, H, 1, 3)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round"
        style={{ transition: 'd 0.3s' }} />
    </svg>
  )
}
