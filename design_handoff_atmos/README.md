# Handoff: Atmos — Ruuvi Sensor Dashboard (Windows / Electron)

## Overview

Atmos is a desktop dashboard for Ruuvi BLE sensors — specifically the **Ruuvi AIR** (temperature, humidity, CO₂, VOC index) and **Ruuvi Temperature** sensors (temperature, humidity, air pressure). The target platform is **Electron for Windows 10/11**, frameless window, 1280×800 default size.

The app shows a list of named locations (rooms) on the left and a detail view of the selected sensor on the right, with a large multi-metric 24h chart as the centerpiece, hero metric tiles, and a live data ticker.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing the intended look and behaviour. They are **not production code to copy directly.** Your task is to recreate these designs in the real Electron app codebase (or, if no codebase exists yet, set one up using a stack appropriate to the team — likely Electron + React + Vite + TypeScript) using whatever component patterns, state management, and styling approach fit.

The HTML mocks use inline styles for portability — please replace those with the codebase's idiomatic styling layer (CSS Modules, Tailwind, styled-components, vanilla-extract, whatever is in use).

## Fidelity

**High-fidelity.** Colours, typography, spacing, and chart rendering are final. Recreate pixel-faithfully and keep the visual language consistent across new screens.

## Files in this bundle

| File | What it is |
|---|---|
| `Atmos Prototype.html` | The interactive prototype — open this first |
| `prototype/data.jsx` | Mock data layer: per-room time series, unit conversion, threshold rules, accent palettes |
| `prototype/ui-chrome.jsx` | Window chrome, sidebar, header components |
| `prototype/ui-content.jsx` | Hero metric tiles, chart card, sparklines |
| `prototype/app.jsx` | Root component, state, tweak wiring |
| `tweaks-panel.jsx` | Design-tool tweak panel (do not ship — for design exploration only) |
| `Ruuvi Dashboard.html` | The earlier exploration canvas with 4 direction variants (A/B/C/D). Direction **D** was selected as the final. |

## Visual direction

Light, paper-toned interface with a single warm accent. Sans-serif body (Helvetica) with **Geist Mono** used for all micro-labels, metadata, codes, and tabular numbers. Hairline rules, generous padding, soft surfaces. Dark mode is supported (mirrored palette, mint or accent-shifted).

## Screens

### 1. Dashboard (only screen in this handoff)

**Purpose:** glanceable view of all paired sensors with a focused detail view of one.

**Layout** (1280 × 800, frameless):

```
┌────────────────────────────────────────────────────────┐
│ Window chrome (34px)                                   │
├────────────┬───────────────────────────────────────────┤
│ Sidebar    │ Header                                    │
│ 256px      ├───────────────────────────────────────────┤
│            │ ┌───────────────────┐ ┌─────────────────┐ │
│ Rooms      │ │                   │ │ Hero tile (big) │ │
│ list       │ │   Chart card      │ ├─────────────────┤ │
│            │ │   (1.6fr)         │ │ Hero tile       │ │
│            │ │                   │ ├─────────────────┤ │
│            │ │                   │ │ Hero tile       │ │
│            │ │                   │ ├─────────────────┤ │
│            │ │                   │ │ Hero tile       │ │
│            │ └───────────────────┘ └─────────────────┘ │
│            │                                    (1fr)  │
│ Hub status │ Main padding: 24 28 26                    │
└────────────┴───────────────────────────────────────────┘
```

#### 1a. Window chrome (34px tall)

- Frameless. Implement Windows-native min / max / close on the right using `BrowserWindow({frame: false})` + the `electron-acrylic-window` or custom controls.
- Left: 8×8 dot-grid mark (one cell tinted with the accent), then `ATMOS`, then `/`, then `home/<room-id>`.
- Right: live indicator (`● live · 1s` — pulsing accent dot, 6px), then three control buttons (32×24, monochrome icons: dash, square outline, X).
- Drag region: the entire bar except the controls. In Electron use `-webkit-app-region: drag` on the bar and `no-drag` on the buttons.
- Background: `palette.bg`; bottom border `1px solid palette.rule`.

#### 1b. Sidebar (256px wide)

- Background: `palette.sidebar` (slightly darker than main bg).
- Padding: `20px 14px 16px`.
- Top: `LOCATIONS` label (Geist Mono, 10px, letter-spacing 0.18em, `palette.faint`) + room count.
- Room cards (see component spec below).
- `+ Pair sensor` button below cards: dashed border, Geist Mono uppercase 11px.
- Footer (auto margin-top): two status lines — `HUB · online · 192.168.1.42`, `GATEWAY · ble · 2 dropped/24h`.

#### 1c. Header

- Eyebrow: `RUUVI · <KIND> · ID <MAC>` (Geist Mono, 10px, 0.18em, `palette.faint`).
- Title: room name. Helvetica, 34px, weight 500, letter-spacing −0.02em.
- Right side: 4 meta cells (LAST / BATTERY / RSSI / FW). Each cell: 9px caps label, 12px value. Battery cell shows a 2px-tall progress bar tinted with the accent.

#### 1d. Chart card

- Surface: `palette.surface`, 10px radius, 1px hairline border.
- Header row: eyebrow `LIVE · LAST <range>` + title (`Indoor climate` for AIR, `Climate` for Temp). Right: range pills `1h · 24h · 7d · 30d`. Active pill: accent dim background + accent edge border + accent text.
- Chart body: see Chart spec below.
- Footer (above the bottom rule): legend dots + last-value chips. Geist Mono 13px values with `°C/°F` / `%` / `ppm` / etc. suffix in `palette.faint`.

#### 1e. Hero tile stack

Four tiles stacked vertically. **First tile is "big"** (surface `surfaceHi`, larger numerals, more padding). Tile composition depends on sensor kind:

| Sensor | Big tile | Tile 2 | Tile 3 | Tile 4 |
|---|---|---|---|---|
| **AIR** | Temperature | Humidity | CO₂ | VOC index |
| **Temp** | Temperature | Humidity | Pressure | Comfort (synthetic) |

Each tile (left side):
- Eyebrow: Geist Mono 9px, 0.2em, `palette.faint`, all caps.
- Value: 46px (big) or 26px (small), weight 400, letter-spacing −0.02em, tabular-nums. Colour is `accent.hex` on the big tile, `palette.ink` on the rest. If a threshold is breached, colour shifts to `warnHex`.
- Unit suffix: 12px, `palette.muted`.
- Subtext: 11px, `palette.muted`. Content varies per metric — see thresholds below.

Each tile (right side):
- Sparkline (96×28, 1.2 stroke, no fill). Uses the metric's full 24h series (same shape as chart but smaller).
- Delta: Geist Mono 10px, e.g. `+0.4° / 1h`. `warnHex` if threshold breached.

Comfort tile (synthetic, Temp sensors only):
- Score = `round(((1 - clamp(|temp−21|/6, 0, 1)) + (1 - clamp(|hum−50|/25, 0, 1))) / 2 × 100)`.
- Right side: 4px-tall progress bar with `POOR · OK · GOOD` Geist Mono 8px under it.

## Components

### Room card (sidebar)

```
┌─────────────────────────────────────┐
│ ● Living Room              AIR      │  ← name + kind tag
│ 21.4°  48%rh  612ppm                │  ← compact readings
└─────────────────────────────────────┘
```

- Default state: transparent background, no border.
- Selected: `palette.surface` background, `palette.rule` border, 2px accent rail on the left edge (full height minus 12px top/bottom).
- Padding: `12px 12px 10px`, radius 6px.
- Status dot 6×6: accent for AIR, `palette.muted` for Temp.
- Name: 13px, weight 500 when selected, 400 otherwise.
- Kind tag: Geist Mono 9px, 0.12em, `palette.faint`.
- Reading row: Geist Mono 11px. Temp in ink, the rest in muted. CO₂ shifts to `warnHex` when > 800 ppm.
- Hover: subtle bg lift (use the same surface but at 50% opacity).
- Click switches the detail view.

### Chart

- SVG viewBox `0 0 760 280`, `preserveAspectRatio="none"` so it stretches.
- Padding 32×14.
- Horizontal gridlines at 0.2/0.4/0.6/0.8 (`palette.rule`).
- Vertical guides at every tick: dashed `1 5`, `palette.rule`.
- X-axis labels per range:
  - `1h` → `−60m −45m −30m −15m now`
  - `24h` → `00:00 04:00 08:00 12:00 16:00 20:00`
  - `7d` → `Mon Tue Wed Thu Fri Sat Sun`
  - `30d` → `1 5 10 15 20 25 30`
- One linear gradient fill under the **temp** path (`accent.hex` 0.16 → 0.0).
- Lines for all visible metrics:
  - temp: stroke 1.8, full opacity
  - others: stroke 1.2, 0.75 opacity
- "Now" markers at the rightmost point of every line: 2.5r filled circle with surface-colour stroke. The temp marker has a 6r 0.18-opacity halo behind it.
- All series-rendering should animate the SVG `d` attribute on range change (`transition: d 0.35s ease`). In React, recompute the path string when range changes — the transition is CSS.

### Sparkline

- 96×28, smooth-curve path identical to the chart's, padX=1 padY=3.
- No grid, no axes.

### Window controls

Use Electron `ipcRenderer` to send `window:minimize`, `window:maximize`, `window:close` to the main process which calls the matching `BrowserWindow` methods. Maximize should toggle between max and restore.

## Design tokens

### Light palette (default)

```ts
bg:         "#f3efe6"
sidebar:    "#ece8df"
surface:    "#fbfaf6"
surfaceHi:  "#ffffff"
ink:        "#1c1916"
muted:      "#7c7268"
faint:      "#a89e91"
rule:       "rgba(28,25,22,0.08)"
ruleStrong: "rgba(28,25,22,0.16)"
warnHex:    "#b8762a"
```

### Dark palette

```ts
bg:         "#0d0f12"
sidebar:    "#0a0c0f"
surface:    "#15181d"
surfaceHi:  "#1c2026"
ink:        "#e8e6e0"
muted:      "#7c8089"
faint:      "#4a4e55"
rule:       "rgba(255,255,255,0.06)"
ruleStrong: "rgba(255,255,255,0.10)"
warnHex:    "#e8a55c"
```

### Accents (user-selectable)

| Name | hex | dim (10% alpha) | edge (28% alpha) |
|---|---|---|---|
| Sienna (default) | `#bf5a30` | `rgba(191,90,48,0.10)` | `rgba(191,90,48,0.28)` |
| Forest | `#3f7a5a` | `rgba(63,122,90,0.10)` | `rgba(63,122,90,0.28)` |
| Ink | `#2b3a55` | `rgba(43,58,85,0.10)` | `rgba(43,58,85,0.28)` |
| Plum | `#8a4a72` | `rgba(138,74,114,0.10)` | `rgba(138,74,114,0.28)` |

### Metric colours (relative to selected accent)

- temp: accent.hex
- humidity: `#6b8caf`
- co2: `palette.warnHex`
- voc: `#9a7a4f`
- pressure: `#7a8a6b`

### Typography

```
sans:  "Helvetica Neue", Helvetica, Arial, sans-serif
mono:  "Geist Mono", "JetBrains Mono", ui-monospace, monospace
```

Self-host both fonts in the Electron app (don't fetch from Google at runtime). Geist Mono is the headline carry — every label, badge, code, delta, time, axis tick, status, key/value pair uses it.

### Sizes

| Token | px | Notes |
|---|---|---|
| chrome-h | 34 | window bar |
| sidebar-w | 256 | |
| main-pad | 24 / 28 / 26 | top / x / bottom |
| gap-comfy | 18 | between hero tiles |
| gap-compact | 12 | density tweak |
| radius-card | 10 | |
| radius-room | 6 | |
| hero-big | 46 (comfy) / 38 (compact) | |
| hero-small | 26 (comfy) / 22 (compact) | |
| title | 34 | room title |

## Interactions

- **Room switching:** click any room card → selected state moves, header / hero stack / chart re-render. No page transition; just a state update. Chart paths animate (`transition: d 0.35s ease`).
- **Range switching:** click `1h/24h/7d/30d` pill → chart re-slices and re-renders with new tick labels.
- **Hover states:** room cards lift to surface background; pills highlight border; control buttons show 6% black tint.
- **Window controls:** min/max/close as described above.
- **Live tick:** the `live · 1s` indicator pulses every second. Real implementation should re-poll the BLE adapter or hub every 1s and push new samples onto each series (sliding window).

## State

```ts
type AppState = {
  selectedRoomId: string;     // "living" | "bedroom" | ...
  range: "1h" | "24h" | "7d" | "30d";
  rooms: Room[];              // live, from the BLE/hub layer
  prefs: {
    units: "C" | "F";
    accent: "#bf5a30" | "#3f7a5a" | "#2b3a55" | "#8a4a72";
    density: "comfortable" | "compact";
    theme: "light" | "dark";
  };
};

type Room = {
  id: string;
  name: string;             // user-editable
  kind: "AIR" | "Temp";
  mac: string;
  battery: number;          // 0-100
  signal: number;           // dBm, typically -40 to -90
  fw: string;
  series: {
    temp: number[];         // °C, regardless of display unit
    humidity: number[];     // %
    co2?: number[];         // ppm (AIR only)
    voc?: number[];         // index (AIR only)
    pressure?: number[];    // hPa (Temp only)
  };
};
```

Persist `prefs` to disk via `electron-store` or similar. Persist `selectedRoomId` so the app re-opens to the last viewed room.

## Threshold rules

| Metric | OK | Warn | Bad |
|---|---|---|---|
| temp | 17–26 °C | outside | — |
| humidity | 30–65 % | outside | — |
| co2 | ≤ 800 ppm | 801–1000 | > 1000 |
| voc | ≤ 100 | > 100 | — |

When a tile breaches, the number switches to `warnHex` and the subtext changes (`stale · ventilate`, `humid`, `cool · below comfort`, etc.). See `subtextFor` in `prototype/ui-content.jsx` for the exact copy mapping.

## Subtext copy (per metric)

- **Temperature:** `< 17` → "cool · below comfort"; `17–19` → "cool"; `19–23` → "comfortable"; `23–26` → "warm"; `> 26` → "hot".
- **Humidity:** `< 30` → "dry"; `> 65` → "humid"; else "optimal range · 40–60".
- **CO₂:** `> 1000` → "stale · ventilate"; `> 800` → "elevated"; else "fresh air".
- **VOC:** `> 100` → "elevated"; else "normal".
- **Pressure:** `> 1015` → "rising · fair"; `< 1010` → "falling · unsettled"; else "steady".

## BLE / data layer (out of scope for this design handoff)

The prototype uses static, hand-shaped 24h series. The real implementation reads from a Ruuvi gateway over MQTT/HTTP or directly via WebBluetooth / a native BLE module (e.g. `noble`). Each sample = `{ts, temp, humidity, [co2, voc, pressure]}`. Maintain a rolling buffer per sensor — at minimum 30d at 5-min resolution.

## Out of scope (future screens)

These are not in this handoff but should fit the same visual system:
- Settings (units, threshold customization, notifications, gateway config)
- Threshold alerts list / notification center
- Sensor pairing wizard
- Export CSV
- Per-metric detail page (zoomed chart, statistics, annotations)

## Assets

No image assets are used. The only graphics are inline SVGs (chart, sparklines, window-control glyphs, dot-grid mark). Fonts (Helvetica, Geist Mono) must be bundled with the Electron app.

## Quick start for the implementing dev

1. Open `Atmos Prototype.html` in a browser to see the working prototype.
2. Click rooms, change ranges, open the Tweaks panel from the toolbar — every interaction in the brief is wired up.
3. Read `prototype/ui-content.jsx` for exact chart maths and threshold-driven colour logic.
4. Read `prototype/data.jsx` for the synthetic data shape — your real data layer should produce the same `Room` and `series` schema.
5. Tokens above are the source of truth; the inline styles in the JSX are illustrative.
