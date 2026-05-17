// Artboard B — Graphite Dark
// Near-black surfaces, single mint accent, Helvetica + Geist Mono micro-labels.

const bStyles = {
  font: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
  bg: '#0d0f12',
  surface: '#15181d',
  surfaceHi: '#1c2026',
  ink: '#e8e6e0',
  muted: '#7c8089',
  faint: '#4a4e55',
  rule: 'rgba(255,255,255,0.06)',
  ruleStrong: 'rgba(255,255,255,0.10)',
  accent: '#7ee0bb',
  accentDim: 'rgba(126,224,187,0.16)',
  warn: '#e8a55c',
  bad: '#e07e7e',
};

function ArtboardB() {
  const r = window.RUUVI;
  const W = 1280, H = 800;
  const selected = r.ROOMS.find(x => x.selected);

  return (
    <div style={{
      width: W, height: H, background: bStyles.bg, color: bStyles.ink,
      fontFamily: bStyles.font, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      <WindowChromeB />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <SidebarB rooms={r.ROOMS} />
        <main style={{ flex: 1, minWidth: 0, padding: '24px 28px 26px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
          <HeaderB room={selected} />
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
            <ChartCardB />
            <HeroStackB room={selected} />
          </div>
        </main>
      </div>
    </div>
  );
}

function WindowChromeB() {
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'center', padding: '0 14px',
      background: bStyles.bg, borderBottom: `1px solid ${bStyles.rule}`,
      fontFamily: bStyles.mono, fontSize: 11, color: bStyles.muted, letterSpacing: '0.04em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,4px)', gap: 2 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width: 4, height: 4, background: i === 0 ? bStyles.accent : bStyles.ink, borderRadius: 0.5 }}></div>)}
        </div>
        <span style={{ color: bStyles.ink }}>ATMOS</span>
        <span style={{ color: bStyles.faint }}>/</span>
        <span>home/living-room</span>
      </div>
      <div style={{ flex: 1 }}></div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 18 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: bStyles.accent, boxShadow: `0 0 8px ${bStyles.accent}` }}></span>
        live · 1s
      </span>
      <div style={{ display: 'flex' }}>
        {['min','max','close'].map((k, i) => (
          <div key={k} style={{
            width: 32, height: 24, display: 'grid', placeItems: 'center', color: bStyles.muted,
          }}>
            {i === 0 && <div style={{ width: 10, height: 1, background: 'currentColor' }}></div>}
            {i === 1 && <div style={{ width: 9, height: 9, border: '1px solid currentColor' }}></div>}
            {i === 2 && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1"/></svg>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarB({ rooms }) {
  return (
    <aside style={{
      width: 256, flexShrink: 0, padding: '20px 14px 16px',
      borderRight: `1px solid ${bStyles.rule}`, background: '#0a0c0f',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ fontFamily: bStyles.mono, fontSize: 10, color: bStyles.faint, letterSpacing: '0.18em' }}>LOCATIONS</div>
        <div style={{ fontFamily: bStyles.mono, fontSize: 10, color: bStyles.muted }}>{rooms.length}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rooms.map(room => <RoomCardB key={room.id} room={room} />)}
      </div>

      <button style={{
        marginTop: 4, background: 'transparent', border: `1px solid ${bStyles.ruleStrong}`,
        borderRadius: 4, padding: '8px 10px', color: bStyles.muted, fontFamily: bStyles.mono,
        fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase',
      }}>+ Pair sensor</button>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: bStyles.mono, fontSize: 10, color: bStyles.muted }}>
        <Stat label="HUB" value="online · 192.168.1.42" />
        <Stat label="GATEWAY" value="ble · 2 dropped/24h" />
      </div>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: bStyles.faint, letterSpacing: '0.14em' }}>{label}</span>
      <span style={{ color: bStyles.muted }}>{value}</span>
    </div>
  );
}

function RoomCardB({ room }) {
  const isAir = room.kind === 'AIR';
  const sel = room.selected;
  const co2 = room.readings.co2;
  const co2Bad = co2 && co2 > 800;
  return (
    <div style={{
      padding: '12px 12px 10px', borderRadius: 6,
      background: sel ? bStyles.surface : 'transparent',
      border: sel ? `1px solid ${bStyles.ruleStrong}` : `1px solid transparent`,
      cursor: 'pointer', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: isAir ? bStyles.accent : bStyles.muted,
            boxShadow: isAir ? `0 0 6px ${bStyles.accent}` : 'none',
          }}></span>
          <span style={{ fontSize: 13, color: sel ? bStyles.ink : bStyles.muted, fontWeight: sel ? 500 : 400 }}>{room.name}</span>
        </div>
        <span style={{ fontFamily: bStyles.mono, fontSize: 9, color: bStyles.faint, letterSpacing: '0.12em' }}>{room.kind.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontFamily: bStyles.mono, fontSize: 11, color: bStyles.muted }}>
        <span style={{ color: bStyles.ink }}>{room.readings.temp.toFixed(1)}°</span>
        <span>{room.readings.humidity}%rh</span>
        {isAir && <span style={{ color: co2Bad ? bStyles.warn : bStyles.muted }}>{co2}ppm</span>}
        {!isAir && <span>{room.readings.pressure}hPa</span>}
      </div>
      {sel && <div style={{ position: 'absolute', left: -1, top: 12, bottom: 12, width: 2, background: bStyles.accent, borderRadius: 2 }}></div>}
    </div>
  );
}

function HeaderB({ room }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: bStyles.mono, fontSize: 10, color: bStyles.faint, letterSpacing: '0.18em', marginBottom: 8 }}>RUUVI · AIR · ID 8F:2C:91</div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em' }}>{room.name}</h1>
      </div>
      <div style={{ display: 'flex', gap: 24, fontFamily: bStyles.mono, fontSize: 10, color: bStyles.muted, letterSpacing: '0.04em' }}>
        <MetaB label="LAST" value={room.lastSeen.toUpperCase()} />
        <MetaB label="BATTERY" value={`${room.battery}%`} bar={room.battery} />
        <MetaB label="RSSI" value={`${room.signal} dBm`} />
        <MetaB label="FW" value="3.31.1" />
      </div>
    </header>
  );
}

function MetaB({ label, value, bar }) {
  return (
    <div style={{ minWidth: 70 }}>
      <div style={{ fontSize: 9, color: bStyles.faint, letterSpacing: '0.18em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: bStyles.ink, marginBottom: bar ? 4 : 0 }}>{value}</div>
      {bar !== undefined && (
        <div style={{ height: 2, background: bStyles.rule, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${bar}%`, height: '100%', background: bStyles.accent }}></div>
        </div>
      )}
    </div>
  );
}

function ChartCardB() {
  const r = window.RUUVI;
  return (
    <div style={{
      background: bStyles.surface, borderRadius: 10,
      border: `1px solid ${bStyles.rule}`, padding: '18px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: bStyles.mono, fontSize: 10, color: bStyles.faint, letterSpacing: '0.18em' }}>LIVE · LAST 24h</div>
          <div style={{ fontSize: 18, marginTop: 2 }}>Indoor climate</div>
        </div>
        <div style={{ display: 'flex', gap: 4, fontFamily: bStyles.mono, fontSize: 10, letterSpacing: '0.08em' }}>
          {['1h','24h','7d','30d'].map((t, i) => (
            <div key={t} style={{
              padding: '5px 10px', borderRadius: 4, textTransform: 'uppercase',
              background: i === 1 ? bStyles.accentDim : 'transparent',
              color: i === 1 ? bStyles.accent : bStyles.muted,
              border: i === 1 ? `1px solid rgba(126,224,187,0.3)` : `1px solid ${bStyles.rule}`,
            }}>{t}</div>
          ))}
        </div>
      </div>

      <ChartB />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, borderTop: `1px solid ${bStyles.rule}`, paddingTop: 12, marginTop: 'auto' }}>
        {[
          { c: bStyles.accent, k: 'temp' },
          { c: '#8fb8d8',      k: 'humidity' },
          { c: bStyles.warn,   k: 'co2' },
          { c: '#c694e0',      k: 'voc' },
        ].map(({ c, k }) => {
          const m = r.METRIC_META[k];
          const last = r.SERIES[k][r.SERIES[k].length - 1];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: c }}></span>
              <span style={{ fontFamily: bStyles.mono, fontSize: 10, color: bStyles.muted, letterSpacing: '0.06em' }}>{m.label.toUpperCase()}</span>
              <span style={{ fontFamily: bStyles.mono, fontSize: 13, color: bStyles.ink }}>{m.fmt(last)}{m.unit && <span style={{ color: bStyles.faint, marginLeft: 2 }}>{m.unit}</span>}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartB() {
  const r = window.RUUVI;
  const w = 760, h = 280, padX = 32, padY = 14;
  const norm = {
    temp: r.normalize(r.SERIES.temp, r.RANGES.temp),
    humidity: r.normalize(r.SERIES.humidity, r.RANGES.humidity),
    co2: r.normalize(r.SERIES.co2, r.RANGES.co2),
    voc: r.normalize(r.SERIES.voc, r.RANGES.voc),
  };
  const colors = { temp: bStyles.accent, humidity: '#8fb8d8', co2: bStyles.warn, voc: '#c694e0' };

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="bGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={bStyles.accent} stopOpacity="0.20"/>
            <stop offset="1" stopColor={bStyles.accent} stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0.2, 0.4, 0.6, 0.8].map(v => (
          <line key={v} x1={padX} x2={w - padX} y1={padY + (h - padY * 2) * v} y2={padY + (h - padY * 2) * v}
            stroke={bStyles.rule} strokeWidth="1" />
        ))}
        {/* vertical guides */}
        {r.HOUR_TICKS.map(hh => {
          const x = padX + ((w - padX * 2) * hh) / 23;
          return (
            <g key={hh}>
              <line x1={x} x2={x} y1={padY} y2={h - padY} stroke={bStyles.rule} strokeWidth="1" strokeDasharray="1 5"/>
              <text x={x} y={h - 2} textAnchor="middle" fontSize="9" fill={bStyles.faint} fontFamily={bStyles.mono} letterSpacing="0.1em">
                {String(hh).padStart(2, '0')}
              </text>
            </g>
          );
        })}

        {/* temp area glow */}
        <path d={`${r.smoothPath(norm.temp, w, h, padX, padY)} L ${w - padX} ${h - padY} L ${padX} ${h - padY} Z`}
          fill="url(#bGlow)" />

        {Object.entries(norm).map(([k, vs]) => (
          <path key={k} d={r.smoothPath(vs, w, h, padX, padY)} fill="none"
            stroke={colors[k]} strokeWidth={k === 'temp' ? 1.8 : 1.2}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={k === 'temp' ? 1 : 0.7} />
        ))}

        {/* now marker */}
        {Object.entries(norm).map(([k, vs]) => {
          const x = padX + (w - padX * 2);
          const y = padY + (h - padY * 2) * (1 - vs[vs.length - 1]);
          return (
            <g key={k}>
              {k === 'temp' && <circle cx={x} cy={y} r="6" fill={colors[k]} opacity="0.18"/>}
              <circle cx={x} cy={y} r="2.5" fill={colors[k]} stroke={bStyles.surface} strokeWidth="1.5"/>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HeroStackB({ room }) {
  const tiles = [
    { key: 'temp', big: true, v: room.readings.temp.toFixed(1), unit: '°C', label: 'TEMPERATURE',
      sub: 'comfortable · target 21°', delta: '+0.4° / 1h' },
    { key: 'humidity', v: room.readings.humidity, unit: '%', label: 'HUMIDITY',
      sub: 'optimal range · 40–60', delta: '−2 / 1h' },
    { key: 'co2', v: room.readings.co2, unit: 'ppm', label: 'CO₂',
      sub: 'fresh air', delta: '+38 / 1h', tone: room.readings.co2 > 800 ? 'warn' : 'ok' },
    { key: 'voc', v: room.readings.voc, unit: '', label: 'VOC INDEX',
      sub: 'normal', delta: 'steady', tone: 'ok' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      {tiles.map(t => <HeroTileB key={t.key} t={t} />)}
    </div>
  );
}

function HeroTileB({ t }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, background: t.big ? bStyles.surfaceHi : bStyles.surface,
      borderRadius: 10, border: `1px solid ${bStyles.rule}`,
      padding: t.big ? '16px 20px' : '12px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.big ? 6 : 2 }}>
        <div style={{ fontFamily: bStyles.mono, fontSize: 9, color: bStyles.faint, letterSpacing: '0.2em' }}>{t.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: t.big ? 46 : 26, fontWeight: 400, letterSpacing: '-0.02em', color: t.big ? bStyles.accent : bStyles.ink }}>{t.v}</span>
          <span style={{ fontSize: 12, color: bStyles.muted }}>{t.unit}</span>
        </div>
        <div style={{ fontSize: 11, color: bStyles.muted }}>{t.sub}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <Sparkline metric={t.key} color={t.tone === 'warn' ? bStyles.warn : (t.big ? bStyles.accent : bStyles.muted)} />
        <span style={{ fontFamily: bStyles.mono, fontSize: 10, color: t.tone === 'warn' ? bStyles.warn : bStyles.muted, letterSpacing: '0.04em' }}>{t.delta}</span>
      </div>
    </div>
  );
}

function Sparkline({ metric, color }) {
  const r = window.RUUVI;
  const w = 96, h = 28;
  const norm = r.normalize(r.SERIES[metric]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={r.smoothPath(norm, w, h, 1, 3)} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

window.ArtboardB = ArtboardB;
