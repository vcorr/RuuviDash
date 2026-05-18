import React from 'react'
import { useTheme } from '../context'
import {
  sliceForRange, normalize, smoothPath,
  METRIC_META, latest, toUnit, displayUnit,
  type Room,
} from '../data'
import type { Sample } from '../ruuvi/types'
import styles from './ChartCard.module.css'

const RANGE_OPTIONS = ['24h', '7d']
const RANGE_LABEL: Record<string, string> = { '24h': '24 H', '7d': '7 D' }

function metricColors(accentHex: string, warnHex: string): Record<string, string> {
  return {
    temp: accentHex,
    humidity: '#6b8caf',
    co2: warnHex,
    voc: '#9a7a4f',
    pressure: '#7a8a6b',
  }
}

interface Props {
  room: Room
  range: string
  onRangeChange: (r: string) => void
}

export default function ChartCard({ room, range, onRangeChange }: Props) {
  const { p, a, units } = useTheme()
  const isAir = room.kind === 'AIR'
  const metrics = isAir ? ['temp', 'humidity', 'co2'] : ['temp', 'humidity', 'pressure']
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
            >
              {RANGE_LABEL[opt] ?? opt}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.rowStack}>
        {metrics.map(k => {
          const m = METRIC_META[k]
          const raw = latest(room, k)
          const disp = k === 'temp' ? toUnit(raw, 'temp', units).toFixed(1) : m.fmt(raw)
          const unit = displayUnit(k, units)
          const series = (room.series as Record<string, Sample[]>)[k] ?? []
          const hasData = series.length > 0
          return (
            <div key={k} className={styles.row}>
              <div className={styles.rowLabel}>
                <span
                  className={styles.rowLabelText}
                  style={{ color: colors[k] }}
                >{m.label.toUpperCase()}</span>
                <span className={styles.rowValue}>
                  {hasData ? disp : '—'}
                  <span className={styles.rowUnit}>{hasData ? unit : ''}</span>
                </span>
              </div>
              <div className={styles.rowChart}>
                <RowChart
                  series={series}
                  range={range}
                  color={colors[k]}
                  withGlow={k === 'temp'}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RowChart({
  series, range, color, withGlow,
}: {
  series: Sample[]; range: string; color: string
  withGlow: boolean
}) {
  const { p } = useTheme()
  const W = 760, H = 64, PX = 4, PY = 4

  const sliced = sliceForRange(series, range)
  // Auto-scale per-metric so live variation is visible. When proper history
  // exists, we may want a hybrid (clamp to a minimum range so noise doesn't
  // appear as wild swings) but for now raw auto-scale matches the Android app.
  const normed = normalize(sliced)
  const path = smoothPath(normed, W, H, PX, PY)
  const fillPath = path && withGlow
    ? `${path} L ${W - PX} ${H - PY} L ${PX} ${H - PY} Z`
    : ''

  const clipId = React.useId()
  const gradId = React.useId()

  const last = normed[normed.length - 1]
  const lastX = W - PX
  const lastY = last != null
    ? PY + (H - PY * 2) * (1 - Math.max(0, Math.min(1, last)))
    : null

  const scaleMin = sliced.length ? Math.min(...sliced) : null
  const scaleMax = sliced.length ? Math.max(...sliced) : null
  const fmtScale = (v: number) => Math.abs(v) >= 100 ? String(Math.round(v)) : v.toFixed(1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={PX} y={0} width={W - PX * 2} height={H} />
        </clipPath>
        {withGlow && (
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      <line
        x1={PX} x2={W - PX}
        y1={H / 2} y2={H / 2}
        stroke={p.rule} strokeWidth="1"
      />

      <g clipPath={`url(#${clipId})`}>
        {fillPath && <path d={fillPath} fill={`url(#${gradId})`} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={withGlow ? 1.8 : 1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={withGlow ? 1 : 0.9}
            style={{ transition: 'd 0.35s ease', vectorEffect: 'non-scaling-stroke' } as React.CSSProperties}
          />
        )}
      </g>

      {lastY != null && (
        <circle cx={lastX} cy={lastY} r="2.5" fill={color} stroke={p.surface} strokeWidth="1.5" />
      )}

      {scaleMax != null && scaleMin != null && scaleMax !== scaleMin && (
        <>
          <text x={PX + 4} y={PY + 8} fontSize="8" fill={p.faint}
            fontFamily='"Geist Mono", ui-monospace, monospace' letterSpacing="0.06em">
            {fmtScale(scaleMax)}
          </text>
          <text x={PX + 4} y={H - PY - 2} fontSize="8" fill={p.faint}
            fontFamily='"Geist Mono", ui-monospace, monospace' letterSpacing="0.06em">
            {fmtScale(scaleMin)}
          </text>
        </>
      )}
    </svg>
  )
}
