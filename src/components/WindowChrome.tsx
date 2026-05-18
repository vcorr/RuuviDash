import React from 'react'
import { useTheme } from '../context'
import type { Room } from '../data'
import { useSyncStatus } from '../ruuvi/store'
import styles from './WindowChrome.module.css'

interface Props { room: Room }

export default function WindowChrome({ room }: Props) {
  const { a } = useTheme()
  const sync = useSyncStatus()

  const send = (ch: string) => {
    if (typeof window !== 'undefined' && (window as any).api) {
      (window as any).api.send(ch)
    }
  }

  const isSyncing = sync.status === 'syncing'
  const isError = sync.status === 'error'
  const indicatorText = isSyncing ? 'syncing history…' : isError ? 'sync error' : 'live · 1s'
  const indicatorColor = isError ? 'var(--warn)' : 'var(--accent)'
  const indicatorShadow = isError ? '#b8762a80' : `${a.hex}80`

  return (
    <div className={styles.chrome}>
      <div className={styles.left}>
        <div className={styles.dotGrid}>
          {[0,1,2,3].map(i => (
            <div key={i} className={styles.dot} style={{ background: i === 0 ? 'var(--accent)' : 'var(--ink)' }} />
          ))}
        </div>
        <span className={styles.appName}>ATMOS</span>
        <span className={styles.sep}>/</span>
        <span className={styles.path}>home/{room.id}</span>
      </div>
      <div className={styles.right}>
        <div className={styles.liveIndicator}>
          <div
            className={`${styles.liveDot} ${isSyncing ? styles.liveDotSyncing : ''}`}
            style={{ background: indicatorColor, boxShadow: `0 0 6px ${indicatorShadow}` }}
          />
          <span>{indicatorText}</span>
        </div>
        <div className={styles.controls} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button className={styles.btn} onClick={() => send('window:minimize')} title="Minimize">
            <div className={styles.minIcon} />
          </button>
          <button className={styles.btn} onClick={() => send('window:maximize')} title="Maximize">
            <div className={styles.maxIcon} />
          </button>
          <button className={styles.btn} onClick={() => send('window:close')} title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
