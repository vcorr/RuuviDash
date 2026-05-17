export interface Palette {
  bg: string; sidebar: string; surface: string; surfaceHi: string;
  ink: string; muted: string; faint: string;
  rule: string; ruleStrong: string; warnHex: string;
}

export interface Accent {
  hex: string; dim: string; edge: string;
}

export interface DensityConfig {
  gap: number; tilePad: string; tileSmallPad: string;
  heroBig: number; heroSmall: number;
}

export interface Theme {
  p: Palette; a: Accent; d: DensityConfig; units: 'C' | 'F';
}

export const LIGHT_PALETTE: Palette = {
  bg: '#f3efe6', sidebar: '#ece8df', surface: '#fbfaf6', surfaceHi: '#ffffff',
  ink: '#1c1916', muted: '#7c7268', faint: '#a89e91',
  rule: 'rgba(28,25,22,0.08)', ruleStrong: 'rgba(28,25,22,0.16)', warnHex: '#b8762a',
}

export const DARK_PALETTE: Palette = {
  bg: '#0d0f12', sidebar: '#0a0c0f', surface: '#15181d', surfaceHi: '#1c2026',
  ink: '#e8e6e0', muted: '#7c8089', faint: '#4a4e55',
  rule: 'rgba(255,255,255,0.06)', ruleStrong: 'rgba(255,255,255,0.10)', warnHex: '#e8a55c',
}

export const ACCENTS: Record<string, Accent> = {
  '#bf5a30': { hex: '#bf5a30', dim: 'rgba(191,90,48,0.10)',  edge: 'rgba(191,90,48,0.28)' },
  '#3f7a5a': { hex: '#3f7a5a', dim: 'rgba(63,122,90,0.10)',  edge: 'rgba(63,122,90,0.28)' },
  '#2b3a55': { hex: '#2b3a55', dim: 'rgba(43,58,85,0.10)',   edge: 'rgba(43,58,85,0.28)' },
  '#8a4a72': { hex: '#8a4a72', dim: 'rgba(138,74,114,0.10)', edge: 'rgba(138,74,114,0.28)' },
}

export const DENSITY: Record<string, DensityConfig> = {
  comfortable: { gap: 18, tilePad: '16px 20px', tileSmallPad: '12px 18px', heroBig: 46, heroSmall: 26 },
  compact:     { gap: 12, tilePad: '12px 16px', tileSmallPad: '10px 14px', heroBig: 38, heroSmall: 22 },
}

export function applyThemeToRoot(theme: Theme): void {
  const r = document.documentElement
  const { p, a, d } = theme
  const set = (k: string, v: string) => r.style.setProperty(k, v)
  set('--bg', p.bg); set('--sidebar', p.sidebar); set('--surface', p.surface)
  set('--surface-hi', p.surfaceHi); set('--ink', p.ink); set('--muted', p.muted)
  set('--faint', p.faint); set('--rule', p.rule); set('--rule-strong', p.ruleStrong)
  set('--warn', p.warnHex); set('--accent', a.hex); set('--accent-dim', a.dim)
  set('--accent-edge', a.edge); set('--gap', `${d.gap}px`)
  set('--hero-big', `${d.heroBig}px`); set('--hero-small', `${d.heroSmall}px`)
  set('--tile-pad', d.tilePad); set('--tile-small-pad', d.tileSmallPad)
}
