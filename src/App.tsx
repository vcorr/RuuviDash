import React, { useState, useEffect } from 'react'
import { LIGHT_PALETTE, DARK_PALETTE, ACCENTS, DENSITY, applyThemeToRoot, type Theme } from './tokens'
import { ThemeContext } from './context'
import { useLiveRooms } from './ruuvi/store'
import WindowChrome from './components/WindowChrome'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ChartCard from './components/ChartCard'
import HeroStack from './components/HeroStack'
import './styles/global.css'

type Range = '24h' | '7d'

interface Prefs {
  units: 'C' | 'F'
  accent: string
  density: 'comfortable' | 'compact'
  theme: 'light' | 'dark'
}

const DEFAULT_PREFS: Prefs = {
  units: 'C', accent: '#bf5a30', density: 'comfortable', theme: 'light',
}

export default function App() {
  const rooms = useLiveRooms()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [range, setRange] = useState<Range>('7d')
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)

  useEffect(() => {
    if (rooms.length > 0 && (selectedId === null || !rooms.find(r => r.id === selectedId))) {
      setSelectedId(rooms[0].id)
    }
  }, [rooms, selectedId])

  const palette = prefs.theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
  const accent = ACCENTS[prefs.accent] ?? ACCENTS['#bf5a30']
  const density = DENSITY[prefs.density] ?? DENSITY.comfortable
  const theme: Theme = { p: palette, a: accent, d: density, units: prefs.units }

  useEffect(() => { applyThemeToRoot(theme) }, [prefs])
  useEffect(() => { applyThemeToRoot(theme) }, [])

  void setPrefs

  const room = rooms.find(r => r.id === selectedId) ?? rooms[0]

  return (
    <ThemeContext.Provider value={theme}>
      <div className="app">
        {room ? <WindowChrome room={room} /> : <div className="chrome-placeholder" />}
        <div className="app-body">
          <Sidebar rooms={rooms} selectedId={selectedId ?? ''} onSelect={setSelectedId} />
          <main className="main">
            {room ? (
              <>
                <Header room={room} />
                <div className="content-grid">
                  <ChartCard room={room} range={range} onRangeChange={r => setRange(r as Range)} />
                  <HeroStack room={room} />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-title">Listening for Ruuvi sensors…</div>
                <div className="empty-sub">Make sure Bluetooth is on and your sensor is in range.</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
