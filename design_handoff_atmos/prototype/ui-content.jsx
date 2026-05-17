// Hero metric stack + multi-metric chart.
// HeroStack adapts to sensor kind (AIR vs Temp).
// Chart draws the right set of metrics for the selected sensor, animates
// path on range change.

const RANGE_OPTIONS = ['1h', '24h', '7d', '30d'];

// Metric color map. Pulled here (not in data) since it depends on accent.
function metricColors(theme) {
  return {
    temp:     theme.a.hex,
    humidity: '#6b8caf',
    co2:      theme.warnHex,
    voc:      '#9a7a4f',
    pressure: '#7a8a6b',
  };
}

// ── Hero tiles ──────────────────────────────────────────────────────────

function PHeroStack({ room }) {
  const t = useTheme();
  const r = window.RUUVI2;
  const isAir = room.kind === 'AIR';

  // Tile definitions — temp is always big. Air gets co2/voc, temp gets pressure.
  let tiles;
  if (isAir) {
    tiles = [
      tileFor(room, 'temp', { big: true, label: 'TEMPERATURE' }),
      tileFor(room, 'humidity', { label: 'HUMIDITY' }),
      tileFor(room, 'co2', { label: 'CO₂' }),
      tileFor(room, 'voc', { label: 'VOC INDEX' }),
    ];
  } else {
    tiles = [
      tileFor(room, 'temp', { big: true, label: 'TEMPERATURE' }),
      tileFor(room, 'humidity', { label: 'HUMIDITY' }),
      tileFor(room, 'pressure', { label: 'PRESSURE' }),
      tileFor(room, '_comfort', { label: 'COMFORT' }),
    ];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: t.d.gap - 6, minHeight: 0 }}>
      {tiles.map(tile => <PHeroTile key={tile.key} tile={tile} room={room} />)}
    </div>
  );
}

function tileFor(room, key, opts) {
  const r = window.RUUVI2;
  if (key === '_comfort') {
    // Synthetic comfort tile for Temp sensors: bias by temp+humidity sweet spot.
    const temp = r.latest(room, 'temp');
    const hum = r.latest(room, 'humidity');
    const tempScore = 1 - Math.min(1, Math.abs(temp - 21) / 6);
    const humScore  = 1 - Math.min(1, Math.abs(hum - 50) / 25);
    const score = Math.round((tempScore + humScore) / 2 * 100);
    return { key, opts, synthetic: true, score };
  }
  const v = r.latest(room, key);
  const past = r.series ? null : null;
  return { key, opts, value: v };
}

function PHeroTile({ tile, room }) {
  const t = useTheme();
  const r = window.RUUVI2;
  const big = !!tile.opts.big;
  const m = r.METRIC_META[tile.key];

  if (tile.synthetic) {
    return (
      <div style={tileStyle(t, big)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={tileLabelStyle(t)}>{tile.opts.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 400, color: t.p.ink, letterSpacing: '-0.02em' }}>{tile.score}</span>
            <span style={{ fontSize: 11, color: t.p.muted }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11, color: t.p.muted }}>
            {tile.score >= 75 ? 'pleasant' : tile.score >= 50 ? 'acceptable' : tile.score >= 25 ? 'uncomfortable' : 'poor'}
          </div>
        </div>
        <ComfortBar score={tile.score} />
      </div>
    );
  }

  const displayValue = tile.key === 'temp'
    ? r.toUnit(tile.value, 'temp', t.units).toFixed(1)
    : m.fmt(tile.value);
  const unit = tile.key === 'temp' ? (t.units === 'F' ? '°F' : '°C') : m.unit;
  const tone = r.tone(tile.key, tile.value);
  const color = tone === 'warn' ? t.warnHex : (big ? t.a.hex : t.p.ink);
  const sub = subtextFor(tile.key, tile.value, t);
  const delta = deltaFor(room, tile.key, t);

  return (
    <div style={tileStyle(t, big)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: big ? 6 : 2 }}>
        <div style={tileLabelStyle(t)}>{tile.opts.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: big ? t.d.heroBig : t.d.heroSmall, fontWeight: 400,
            letterSpacing: '-0.02em', color, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{displayValue}</span>
          <span style={{ fontSize: 12, color: t.p.muted }}>{unit}</span>
        </div>
        <div style={{ fontSize: 11, color: t.p.muted }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <PSparkline metric={tile.key} room={room} color={tone === 'warn' ? t.warnHex : (big ? t.a.hex : t.p.muted)} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: tone === 'warn' ? t.warnHex : t.p.muted, letterSpacing: '0.04em' }}>{delta}</span>
      </div>
    </div>
  );
}

function tileStyle(t, big) {
  return {
    flex: 1, minHeight: 0,
    background: big ? t.p.surfaceHi : t.p.surface,
    borderRadius: 10, border: `1px solid ${t.p.rule}`,
    padding: big ? t.d.tilePad : t.d.tileSmallPad,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    transition: 'background 0.2s',
  };
}
function tileLabelStyle(t) {
  return { fontFamily: MONO, fontSize: 9, color: t.p.faint, letterSpacing: '0.2em' };
}

function subtextFor(metric, v, t) {
  if (metric === 'temp') {
    const c = v;
    if (c < 17) return 'cool · below comfort';
    if (c < 19) return 'cool';
    if (c <= 23) return 'comfortable';
    if (c <= 26) return 'warm';
    return 'hot';
  }
  if (metric === 'humidity') {
    if (v < 30) return 'dry';
    if (v > 65) return 'humid';
    return 'optimal range · 40–60';
  }
  if (metric === 'co2') {
    if (v > 1000) return 'stale · ventilate';
    if (v > 800) return 'elevated';
    return 'fresh air';
  }
  if (metric === 'voc') {
    if (v > 100) return 'elevated';
    return 'normal';
  }
  if (metric === 'pressure') {
    return v > 1015 ? 'rising · fair' : v < 1010 ? 'falling · unsettled' : 'steady';
  }
  return '';
}

function deltaFor(room, metric, t) {
  const s = room.series[metric];
  if (!s) return '';
  const last = s[s.length - 1];
  const prev = s[s.length - 2] ?? last;
  const d = last - prev;
  if (metric === 'temp') {
    const dDisp = t.units === 'F' ? d * 9/5 : d;
    return `${dDisp >= 0 ? '+' : ''}${dDisp.toFixed(1)}° / 1h`;
  }
  if (metric === 'humidity') return `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`;
  if (metric === 'co2')      return `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`;
  if (metric === 'voc')      return Math.abs(d) < 1 ? 'steady' : `${d >= 0 ? '+' : ''}${Math.round(d)} / 1h`;
  if (metric === 'pressure') return `${d >= 0 ? '+' : ''}${d.toFixed(1)} / 1h`;
  return '';
}

function ComfortBar({ score }) {
  const t = useTheme();
  return (
    <div style={{ width: 96, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <div style={{ width: '100%', height: 4, background: t.p.rule, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: t.a.hex, transition: 'width 0.4s' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: MONO, fontSize: 8, color: t.p.faint, letterSpacing: '0.1em' }}>
        <span>POOR</span><span>OK</span><span>GOOD</span>
      </div>
    </div>
  );
}

function PSparkline({ metric, room, color }) {
  const r = window.RUUVI2;
  const values = room.series[metric];
  if (!values) return null;
  const w = 96, h = 28;
  const norm = r.normalize(values);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <path d={r.smoothPath(norm, w, h, 1, 3)} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round"
        style={{ transition: 'd 0.3s' }} />
    </svg>
  );
}

// ── Chart card ───────────────────────────────────────────────────────────

function PChartCard({ room, range, onRangeChange }) {
  const t = useTheme();
  const r = window.RUUVI2;
  const isAir = room.kind === 'AIR';
  const metrics = isAir ? ['temp','humidity','co2','voc'] : ['temp','humidity','pressure'];
  const colors = metricColors(t);

  return (
    <div style={{
      background: t.p.surface, borderRadius: 10,
      border: `1px solid ${t.p.rule}`, padding: '18px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: t.p.faint, letterSpacing: '0.18em' }}>
            LIVE · LAST {range.toUpperCase()}
          </div>
          <div style={{ fontSize: 18, marginTop: 2 }}>{isAir ? 'Indoor climate' : 'Climate'}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em' }}>
          {RANGE_OPTIONS.map(opt => {
            const active = opt === range;
            return (
              <button key={opt} onClick={() => onRangeChange(opt)} style={{
                padding: '5px 10px', borderRadius: 4, textTransform: 'uppercase',
                background: active ? t.a.dim : 'transparent',
                color: active ? t.a.hex : t.p.muted,
                border: active ? `1px solid ${t.a.edge}` : `1px solid ${t.p.rule}`,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
                transition: 'all 0.15s',
              }}>{opt}</button>
            );
          })}
        </div>
      </div>

      <PChart room={room} range={range} metrics={metrics} colors={colors} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, borderTop: `1px solid ${t.p.rule}`, paddingTop: 12, marginTop: 'auto' }}>
        {metrics.map(k => {
          const m = r.METRIC_META[k];
          const last = r.latest(room, k);
          const disp = k === 'temp' ? r.toUnit(last, 'temp', t.units).toFixed(1) : m.fmt(last);
          const unit = k === 'temp' ? (t.units === 'F' ? '°F' : '°C') : m.unit;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: colors[k] }}></span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.p.muted, letterSpacing: '0.06em' }}>{m.label.toUpperCase()}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: t.p.ink, fontVariantNumeric: 'tabular-nums' }}>
                {disp}<span style={{ color: t.p.faint, marginLeft: 2 }}>{unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PChart({ room, range, metrics, colors }) {
  const t = useTheme();
  const r = window.RUUVI2;
  const w = 760, h = 280, padX = 32, padY = 14;
  const ticks = r.rangeTicks(range);

  const sliced = {};
  metrics.forEach(k => { sliced[k] = r.sliceForRange(room.series[k], range); });

  const norm = {};
  metrics.forEach(k => { norm[k] = r.normalize(sliced[k], r.RANGES[k]); });

  const tempPath = r.smoothPath(norm.temp, w, h, padX, padY);

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="pChartGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={t.a.hex} stopOpacity="0.16"/>
            <stop offset="1" stopColor={t.a.hex} stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0.2, 0.4, 0.6, 0.8].map(v => (
          <line key={v} x1={padX} x2={w - padX} y1={padY + (h - padY * 2) * v} y2={padY + (h - padY * 2) * v}
            stroke={t.p.rule} strokeWidth="1" />
        ))}

        {/* x ticks */}
        {ticks.map((label, i) => {
          const x = padX + ((w - padX * 2) * i) / Math.max(1, ticks.length - 1);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={padY} y2={h - padY} stroke={t.p.rule} strokeWidth="1" strokeDasharray="1 5"/>
              <text x={x} y={h - 2} textAnchor="middle" fontSize="9" fill={t.p.faint} fontFamily={MONO} letterSpacing="0.1em">
                {label}
              </text>
            </g>
          );
        })}

        {/* temp area glow */}
        <path d={`${tempPath} L ${w - padX} ${h - padY} L ${padX} ${h - padY} Z`} fill="url(#pChartGlow)" />

        {metrics.map(k => (
          <path key={k} d={r.smoothPath(norm[k], w, h, padX, padY)} fill="none"
            stroke={colors[k]} strokeWidth={k === 'temp' ? 1.8 : 1.2}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={k === 'temp' ? 1 : 0.75}
            style={{ transition: 'd 0.35s ease' }} />
        ))}

        {/* now markers */}
        {metrics.map(k => {
          const vs = norm[k];
          const x = padX + (w - padX * 2);
          const y = padY + (h - padY * 2) * (1 - vs[vs.length - 1]);
          return (
            <g key={k}>
              {k === 'temp' && <circle cx={x} cy={y} r="6" fill={colors[k]} opacity="0.18"/>}
              <circle cx={x} cy={y} r="2.5" fill={colors[k]} stroke={t.p.surface} strokeWidth="1.5"/>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { PHeroStack, PChartCard });
