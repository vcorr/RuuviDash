import React, { useState, useEffect } from 'react'
import { ROOMS } from './data'
import { LIGHT_PALETTE, DARK_PALETTE, ACCENTS, DENSITY, applyThemeToRoot, type Theme } from './tokens'
import { ThemeContext } from './context'
import WindowChrome from './components/WindowChrome'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ChartCard from './components/ChartCard'
import HeroStack from './components/HeroStack'
import './styles/global.css'

type Range = '1h' | '24h' | '7d' | '30d'

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
  const [selectedId, setSelectedId] = useState('living')
  const [range, setRange] = useState<Range>('24h')
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)

  const room = ROOMS.find(r => r.id === selectedId) ?? ROOMS[0]
  const palette = prefs.theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
  const accent = ACCENTS[prefs.accent] ?? ACCENTS['#bf5a30']
  const density = DENSITY[prefs.density] ?? DENSITY.comfortable

  const theme: Theme = { p: palette, a: accent, d: density, units: prefs.units }

  useEffect(() => { applyThemeToRoot(theme) }, [prefs])

  // Apply on first render
  useEffect(() => { applyThemeToRoot(theme) }, [])

  // prefs setter exposed for future settings panel
  void setPrefs

  return (
    <ThemeContext.Provider value={theme}>
      <div className="app">
        <WindowChrome room={room} />
        <div className="app-body">
          <Sidebar rooms={ROOMS} selectedId={selectedId} onSelect={setSelectedId} />
          <main className="main">
            <Header room={room} />
            <div className="content-grid">
              <ChartCard room={room} range={range} onRangeChange={r => setRange(r as Range)} />
              <HeroStack room={room} />
            </div>
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
