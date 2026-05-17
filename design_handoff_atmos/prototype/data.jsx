// Prototype data layer.
// Per-room 24h series (deterministic, shaped per room kind), unit util,
// accent palettes, time-range presets, and threshold rules.

// Base 24h series (hourly). Same shape as the canvas explorations.
const BASE = {
  temp:     [20.1,19.8,19.6,19.4,19.3,19.2,19.4,19.9,20.5,21.0,21.4,21.8,22.0,22.1,21.9,21.7,21.5,21.4,21.6,21.8,21.7,21.4,21.0,20.6],
  humidity: [52, 53, 54, 55, 55, 56, 56, 55, 53, 51, 49, 48, 47, 47, 46, 46, 47, 48, 49, 51, 52, 51, 50, 49],
  co2:      [480,470,460,455,450,450,470,540,640,720,780,810,820,800,760,720,690,720,790,860,910,830,720,610],
  voc:      [18, 17, 17, 16, 16, 16, 17, 19, 21, 22, 23, 24, 24, 23, 22, 21, 22, 24, 32, 38, 31, 26, 22, 20],
  pressure: [1013,1013,1013,1013,1013,1013,1014,1014,1014,1014,1014,1014,1014,1014,1013,1013,1013,1013,1013,1013,1013,1013,1013,1013],
};

// Shape a series by adding a per-room offset and scaling its swing. Pure
// function of inputs so it's stable across renders.
function shape(arr, offset, scale = 1) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.map(v => mean + offset + (v - mean) * scale);
}

const ROOMS = [
  {
    id: 'living', name: 'Living Room', kind: 'AIR', battery: 92, signal: -54, fw: '3.31.1', mac: '8F:2C:91',
    series: {
      temp:     shape(BASE.temp, 0, 1),
      humidity: shape(BASE.humidity, -4, 0.9),
      co2:      shape(BASE.co2, 0, 1),
      voc:      shape(BASE.voc, 0, 1),
    },
  },
  {
    id: 'bedroom', name: 'Bedroom', kind: 'Temp', battery: 78, signal: -61, fw: '3.31.1', mac: 'A2:4B:14',
    series: {
      temp:     shape(BASE.temp, -2.2, 0.7),
      humidity: shape(BASE.humidity, 6, 0.6),
      pressure: shape(BASE.pressure, 0, 1),
    },
  },
  {
    id: 'office', name: 'Office', kind: 'Temp', battery: 64, signal: -68, fw: '3.31.1', mac: 'C8:71:E3',
    series: {
      temp:     shape(BASE.temp, 0.6, 1.1),
      humidity: shape(BASE.humidity, -7, 1.0),
      pressure: shape(BASE.pressure, 0.5, 1),
    },
  },
  {
    id: 'balcony', name: 'Balcony', kind: 'Temp', battery: 58, signal: -77, fw: '3.31.1', mac: 'D1:09:5A',
    series: {
      temp:     shape(BASE.temp, -12, 2.6),
      humidity: shape(BASE.humidity, 20, 1.4),
      pressure: shape(BASE.pressure, -1.5, 1.4),
    },
  },
];

// Latest reading per metric is just the last sample.
function latest(room, key) {
  const s = room.series[key];
  return s ? s[s.length - 1] : null;
}

// Compute min/max across a slice of the series for a given range key.
function stats(values, range = '24h') {
  const slice = sliceForRange(values, range);
  return {
    min: Math.min(...slice),
    max: Math.max(...slice),
    last: slice[slice.length - 1],
    first: slice[0],
  };
}

// Time ranges. The base series is 24h hourly. For shorter/longer ranges we
// resample deterministically — last N hours for 1h/24h, repeated tile + small
// drift for 7d/30d. Always returns an array of numbers.
function sliceForRange(values, range) {
  switch (range) {
    case '1h':   return values.slice(-2);           // last hour: 2 samples
    case '24h':  return values.slice();
    case '7d':   return tile(values, 7);
    case '30d':  return tile(values, 30);
    default:     return values.slice();
  }
}

function tile(values, days) {
  // 1 sample per ~3h to keep chart tractable. days * 8 samples.
  const samples = days * 8;
  const out = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * 24;
    const idx = Math.floor(t) % values.length;
    const next = (idx + 1) % values.length;
    const frac = t - Math.floor(t);
    const drift = Math.sin((i / samples) * Math.PI * 4) * 0.6;
    out[i] = values[idx] * (1 - frac) + values[next] * frac + drift;
  }
  return out;
}

// Range x-axis tick labels for the chart.
function rangeTicks(range) {
  switch (range) {
    case '1h':  return ['−60m','−45m','−30m','−15m','now'];
    case '24h': return ['00:00','04:00','08:00','12:00','16:00','20:00'];
    case '7d':  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    case '30d': return ['1','5','10','15','20','25','30'];
    default:    return [];
  }
}

const METRIC_META = {
  temp:     { label: 'Temperature', unit: '°', longUnit: 'temp',     fmt: v => v.toFixed(1), kind: 'temp' },
  humidity: { label: 'Humidity',    unit: '%', longUnit: 'humidity', fmt: v => String(Math.round(v)), kind: 'pct' },
  co2:      { label: 'CO₂',         unit: 'ppm', longUnit: 'co2',    fmt: v => String(Math.round(v)), kind: 'ppm' },
  voc:      { label: 'VOC Index',   unit: 'idx', longUnit: 'voc',    fmt: v => String(Math.round(v)), kind: 'idx' },
  pressure: { label: 'Pressure',    unit: 'hPa', longUnit: 'pressure', fmt: v => String(Math.round(v)), kind: 'hpa' },
};

// Display ranges per metric (used by chart normalization).
const RANGES = {
  temp:     [12, 26],
  humidity: [25, 75],
  co2:      [400, 1000],
  voc:      [10, 45],
  pressure: [1008, 1018],
};

// Unit conversion. We store °C internally; convert at the display boundary.
function toUnit(v, kind, units) {
  if (kind === 'temp' && units === 'F') return v * 9/5 + 32;
  return v;
}
function unitSuffix(kind, units) {
  if (kind === 'temp') return units === 'F' ? '°F' : '°C';
  return METRIC_META[Object.keys(METRIC_META).find(k => METRIC_META[k].kind === kind)]?.unit || '';
}

// Threshold rules — what counts as ok/warn/bad per metric.
function tone(metric, v) {
  if (metric === 'co2') {
    if (v > 1000) return 'bad';
    if (v > 800) return 'warn';
    return 'ok';
  }
  if (metric === 'voc' && v > 100) return 'warn';
  if (metric === 'humidity') {
    if (v < 30 || v > 65) return 'warn';
    return 'ok';
  }
  if (metric === 'temp') {
    if (v < 17 || v > 26) return 'warn';
    return 'ok';
  }
  return 'ok';
}

// Smooth path helper, shared.
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

function normalize(values, range) {
  let lo, hi;
  if (range) { [lo, hi] = range; }
  else {
    lo = Math.min(...values); hi = Math.max(...values);
    const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad;
  }
  return values.map(v => (v - lo) / (hi - lo));
}

// Accent palette options. Each is [light-paper-bg, accent-hex].
const ACCENTS = {
  sienna:    { hex: '#bf5a30', dim: 'rgba(191,90,48,0.10)',  edge: 'rgba(191,90,48,0.28)' },
  forest:    { hex: '#3f7a5a', dim: 'rgba(63,122,90,0.10)',  edge: 'rgba(63,122,90,0.28)' },
  ink:       { hex: '#2b3a55', dim: 'rgba(43,58,85,0.10)',   edge: 'rgba(43,58,85,0.28)' },
  plum:      { hex: '#8a4a72', dim: 'rgba(138,74,114,0.10)', edge: 'rgba(138,74,114,0.28)' },
};

// Light + dark palette presets. Dark mirrors the original Graphite B variant.
const PALETTES = {
  light: {
    bg:        '#f3efe6',
    sidebar:   '#ece8df',
    surface:   '#fbfaf6',
    surfaceHi: '#ffffff',
    ink:       '#1c1916',
    muted:     '#7c7268',
    faint:     '#a89e91',
    rule:      'rgba(28,25,22,0.08)',
    ruleStrong:'rgba(28,25,22,0.16)',
  },
  dark: {
    bg:        '#0d0f12',
    sidebar:   '#0a0c0f',
    surface:   '#15181d',
    surfaceHi: '#1c2026',
    ink:       '#e8e6e0',
    muted:     '#7c8089',
    faint:     '#4a4e55',
    rule:      'rgba(255,255,255,0.06)',
    ruleStrong:'rgba(255,255,255,0.10)',
  },
};

window.RUUVI2 = {
  ROOMS, METRIC_META, RANGES, ACCENTS, PALETTES,
  latest, stats, sliceForRange, rangeTicks,
  toUnit, unitSuffix, tone, smoothPath, normalize,
};
