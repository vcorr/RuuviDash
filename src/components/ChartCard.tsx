import React from 'react'
import { useTheme } from '../context'
import { sliceForRange, normalize, smoothPath, rangeTicks, DISPLAY_RANGES, METRIC_META, latest, toUnit, displayUnit, type Room } from '../data'
import styles from './ChartCard.module.css'

const RANGE_OPTIONS = ['1h', '24h', '7d', '30d']
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace'

function metricColors(accentHex: string, warnHex: string): Record<string, string> {
  return { temp: accentHex, humidity: '#6b8caf', co2: warnHex, voc: '#9a7a4f', pressure: '#7a8a6b' }
}

interface Props {
  room: Room
  range: string
  onRangeChange: (r: string) => void
}

export default function ChartCard({ room, range, onRangeChange }: Props) {
  const { p, a, units } = useTheme()
  const isAir = room.kind === 'AIR'
  const metrics = isAir ? ['temp','humidity','co2','voc'] : ['temp','humidity','pressure']
  const colors = metricColors(a.hex, p.warnHex)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.eyebrow}>LIVE · LAST {range.toUpperCase()}</div>
          <div className={styles.chartTitle}>{isAir ? 'Indoor climate' : 'Climate'}</div>
        </div>
        <div className={styles.pills}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => onRangeChange(opt)}
              className={styles.pill}
              style={opt === range ? {
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                borderColor: 'var(--accent-edge)',
              } : {}}
            >{opt}</button>
          ))}
        </div>
      </div>

      <div className={styles.chartWrap}>
        <Chart room={room} range={range} metrics={metrics} colors={colors} warnHex={p.warnHex} />
      </div>

      <div className={styles.legend}>
        {metrics.map(k => {
          const m = METRIC_META[k]
          const val = latest(room, k)
          const disp = k === 'temp' ? toUnit(val, 'temp', units).toFixed(1) : m.fmt(val)
          const unit = displayUnit(k, units)
          return (
            <div key={k} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: colors[k] }} />
              <span className={styles.legendLabel}>{m.label.toUpperCase()}</span>
              <span className={styles.legendValue}>
                {disp}<span className={styles.legendUnit}>{unit}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chart({ room, range, metrics, colors }: {
  room: Room; range: string; metrics: string[]; colors: Record<string, string>; warnHex: string
}) {
  const { p, a } = useTheme()
  const W = 760, H = 280, PX = 32, PY = 14
  const ticks = rangeTicks(range)

  const sliced: Record<string, number[]> = {}
  metrics.forEach(k => { sliced[k] = sliceForRange((room.series as Record<string, number[]>)[k] ?? [], range) })

  const normed: Record<string, number[]> = {}
  metrics.forEach(k => { normed[k] = normalize(sliced[k], DISPLAY_RANGES[k]) })

  const tempPath = smoothPath(normed.temp, W, H, PX, PY)
  const fillPath = `${tempPath} L ${W - PX} ${H - PY} L ${PX} ${H - PY} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGlow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={a.hex} stopOpacity="0.16" />
          <stop offset="1" stopColor={a.hex} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.2, 0.4, 0.6, 0.8].map(v => (
        <line key={v}
          x1={PX} x2={W - PX}
          y1={PY + (H - PY * 2) * v} y2={PY + (H - PY * 2) * v}
          stroke={p.rule} strokeWidth="1" />
      ))}

      {ticks.map((label, i) => {
        const x = PX + ((W - PX * 2) * i) / Math.max(1, ticks.length - 1)
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={PY} y2={H - PY}
              stroke={p.rule} strokeWidth="1" strokeDasharray="1 5" />
            <text x={x} y={H - 2} textAnchor="middle" fontSize="9" fill={p.faint}
              fontFamily={MONO} letterSpacing="0.1em">{label}</text>
          </g>
        )
      })}

      <path d={fillPath} fill="url(#chartGlow)" />

      {metrics.map(k => (
        <path key={k}
          d={smoothPath(normed[k], W, H, PX, PY)}
          fill="none"
          stroke={colors[k]}
          strokeWidth={k === 'temp' ? 1.8 : 1.2}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={k === 'temp' ? 1 : 0.75}
          style={{ transition: 'd 0.35s ease' }} />
      ))}

      {metrics.map(k => {
        const vs = normed[k]
        if (!vs.length) return null
        const x = W - PX
        const y = PY + (H - PY * 2) * (1 - vs[vs.length - 1])
        return (
          <g key={k}>
            {k === 'temp' && <circle cx={x} cy={y} r="6" fill={colors[k]} opacity="0.18" />}
            <circle cx={x} cy={y} r="2.5" fill={colors[k]} stroke={p.surface} strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}
