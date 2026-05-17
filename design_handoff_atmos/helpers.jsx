// Shared data + chart helpers for the Ruuvi dashboard variants.
// Everything is deterministic — no Math.random() at render time.

// 24h hourly samples for 4 metrics. Hand-shaped so the curves look natural
// (cool overnight dip, midday warmth, CO2 rises while occupied, VOC bumps
// when someone cooks at ~19:00).
const SERIES = {
  temp:     [20.1,19.8,19.6,19.4,19.3,19.2,19.4,19.9,20.5,21.0,21.4,21.8,22.0,22.1,21.9,21.7,21.5,21.4,21.6,21.8,21.7,21.4,21.0,20.6],
  humidity: [52, 53, 54, 55, 55, 56, 56, 55, 53, 51, 49, 48, 47, 47, 46, 46, 47, 48, 49, 51, 52, 51, 50, 49],
  co2:      [480,470,460,455,450,450,470,540,640,720,780,810,820,800,760,720,690,720,790,860,910,830,720,610],
  voc:      [18, 17, 17, 16, 16, 16, 17, 19, 21, 22, 23, 24, 24, 23, 22, 21, 22, 24, 32, 38, 31, 26, 22, 20],
};

const ROOMS = [
  {
    id: 'living',
    name: 'Living Room',
    kind: 'AIR',
    selected: true,
    readings: { temp: 21.4, humidity: 48, co2: 612, voc: 24 },
    battery: 92,
    signal: -54,
    lastSeen: '12 sec ago',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    kind: 'Temp',
    readings: { temp: 19.2, humidity: 54, pressure: 1013 },
    battery: 78,
    signal: -61,
    lastSeen: '38 sec ago',
  },
  {
    id: 'office',
    name: 'Office',
    kind: 'Temp',
    readings: { temp: 22.1, humidity: 41, pressure: 1014 },
    battery: 64,
    signal: -68,
    lastSeen: '1 min ago',
  },
  {
    id: 'balcony',
    name: 'Balcony',
    kind: 'Temp',
    readings: { temp: 8.6, humidity: 71, pressure: 1011 },
    battery: 58,
    signal: -77,
    lastSeen: '2 min ago',
  },
];

// Build an SVG path for a metric within a viewBox. values is 0..1 normalized
// by the caller. Smooth catmull-rom-ish curve via simple cubic mid-control
// points — cheaper than importing a curve library and looks fine for 24
// hourly samples.
function smoothPath(values, w, h, padX = 0, padY = 0) {
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const xs = values.map((_, i) => padX + (innerW * i) / (values.length - 1));
  const ys = values.map(v => padY + innerH * (1 - v));
  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cx.toFixed(2)} ${ys[i - 1].toFixed(2)}, ${cx.toFixed(2)} ${ys[i].toFixed(2)}, ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`;
  }
  return d;
}

// Normalize a raw series to 0..1 against either a fixed range or its own
// min/max with padding. Returns the normalized array.
function normalize(values, range) {
  let lo, hi;
  if (range) {
    [lo, hi] = range;
  } else {
    lo = Math.min(...values);
    hi = Math.max(...values);
    const pad = (hi - lo) * 0.15 || 1;
    lo -= pad; hi += pad;
  }
  return values.map(v => (v - lo) / (hi - lo));
}

// Display ranges that keep all 4 metrics readable when stacked on one chart.
const RANGES = {
  temp:     [18, 24],
  humidity: [35, 65],
  co2:      [400, 1000],
  voc:      [10, 45],
};

const METRIC_META = {
  temp:     { label: 'Temperature', unit: '°C', fmt: v => v.toFixed(1) },
  humidity: { label: 'Humidity',    unit: '%',  fmt: v => Math.round(v) },
  co2:      { label: 'CO₂',         unit: 'ppm', fmt: v => Math.round(v) },
  voc:      { label: 'VOC index',   unit: '',    fmt: v => Math.round(v) },
  pressure: { label: 'Pressure',    unit: 'hPa', fmt: v => Math.round(v) },
};

// Hour labels every 4 hours.
const HOUR_TICKS = [0, 4, 8, 12, 16, 20];

window.RUUVI = { SERIES, ROOMS, smoothPath, normalize, RANGES, METRIC_META, HOUR_TICKS };
