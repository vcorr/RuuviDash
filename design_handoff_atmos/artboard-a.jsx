// Artboard A — Editorial Light
// Paper-cream surfaces, hairline rules, Instrument Serif hero numerals.

const aStyles = {
  font: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
  paper: '#f3efe6',
  card: '#fbfaf6',
  ink: '#1c1916',
  muted: '#7c7268',
  faint: '#a89e91',
  rule: 'rgba(28,25,22,0.08)',
  ruleStrong: 'rgba(28,25,22,0.14)',
  accent: '#bf5a30',
  accentSoft: '#f0d9cb',
  good: '#5d8a4e',
};

function ArtboardA() {
  const r = window.RUUVI;
  const W = 1280, H = 800;
  const selected = r.ROOMS.find(x => x.selected);

  return (
    <div style={{
      width: W, height: H, background: aStyles.paper, color: aStyles.ink,
      fontFamily: aStyles.font, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Window chrome */}
      <WindowChromeA />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{
          width: 268, flexShrink: 0, padding: '20px 18px 18px',
          borderRight: `1px solid ${aStyles.rule}`,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <BrandMarkA />
          <SearchA />
          <SectionLabelA>Locations</SectionLabelA>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {r.ROOMS.map(room => <RoomItemA key={room.id} room={room} />)}
          </div>
          <button style={{
            background: 'transparent', border: `1px dashed ${aStyles.ruleStrong}`,
            borderRadius: 6, padding: '8px 10px', color: aStyles.muted,
            fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add device
          </button>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: aStyles.faint }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: aStyles.good }}></span>
            Hub online · 4 sensors
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden' }}>
          <HeaderA room={selected} />
          <HeroRowA room={selected} />
          <ChartCardA room={selected} />
        </main>
      </div>
    </div>
  );
}

function WindowChromeA() {
  return (
    <div style={{
      height: 38, display: 'flex', alignItems: 'center',
      padding: '0 14px', borderBottom: `1px solid ${aStyles.rule}`,
      WebkitAppRegion: 'drag', userSelect: 'none', fontSize: 12,
      color: aStyles.muted, letterSpacing: '0.02em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: aStyles.ink }}></div>
        <span style={{ color: aStyles.ink, fontWeight: 500 }}>ruuvi</span>
        <span style={{ color: aStyles.faint }}>·</span>
        <span>Home</span>
      </div>
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', gap: 2 }}>
        {['—','▢','×'].map((g, i) => (
          <div key={i} style={{
            width: 36, height: 26, display: 'grid', placeItems: 'center',
            color: i === 2 ? aStyles.ink : aStyles.muted, fontSize: i === 1 ? 9 : 13,
            fontFamily: 'system-ui',
          }}>{g}</div>
        ))}
      </div>
    </div>
  );
}

function BrandMarkA() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: aStyles.serif, fontSize: 26, fontStyle: 'italic', lineHeight: 1 }}>Atmos</span>
      <span style={{ fontSize: 10, color: aStyles.faint, letterSpacing: '0.14em', textTransform: 'uppercase' }}>v1.2</span>
    </div>
  );
}

function SearchA() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, height: 30,
      padding: '0 10px', background: '#fff',
      border: `1px solid ${aStyles.rule}`, borderRadius: 6,
      fontSize: 12, color: aStyles.faint,
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M7.7 7.7L10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      Search rooms, sensors…
      <span style={{ marginLeft: 'auto', fontSize: 10, color: aStyles.faint, border: `1px solid ${aStyles.rule}`, padding: '1px 4px', borderRadius: 3 }}>⌘K</span>
    </div>
  );
}

function SectionLabelA({ children }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: aStyles.faint, marginBottom: -2 }}>
      {children}
    </div>
  );
}

function RoomItemA({ room }) {
  const isAir = room.kind === 'AIR';
  const sel = room.selected;
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 6,
      background: sel ? '#fff' : 'transparent',
      boxShadow: sel ? '0 1px 0 rgba(28,25,22,0.04), 0 0 0 1px rgba(28,25,22,0.06)' : 'none',
      cursor: 'pointer', position: 'relative',
    }}>
      {sel && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 2, background: aStyles.accent, borderRadius: 2 }}></div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: sel ? 500 : 400 }}>{room.name}</span>
        <span style={{ fontSize: 9, letterSpacing: '0.12em', color: isAir ? aStyles.accent : aStyles.faint, textTransform: 'uppercase' }}>{room.kind}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: aStyles.muted }}>
        <span><span style={{ fontFamily: aStyles.serif, fontStyle: 'italic', fontSize: 14, color: aStyles.ink }}>{room.readings.temp.toFixed(1)}</span>°</span>
        <span>{room.readings.humidity}%</span>
        {isAir && <span>{room.readings.co2} ppm</span>}
      </div>
    </div>
  );
}

function HeaderA({ room }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 18, borderBottom: `1px solid ${aStyles.rule}` }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: aStyles.faint, marginBottom: 8 }}>Location · AIR sensor</div>
        <h1 style={{ margin: 0, fontFamily: aStyles.serif, fontSize: 44, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em' }}>
          {room.name}<span style={{ color: aStyles.accent, fontStyle: 'italic' }}>.</span>
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 22, fontSize: 11, color: aStyles.muted, paddingBottom: 4 }}>
        <Meta label="Last seen" value={room.lastSeen} />
        <Meta label="Battery" value={`${room.battery}%`} />
        <Meta label="Signal" value={`${room.signal} dBm`} />
        <Meta label="Firmware" value="3.31.1" />
      </div>
    </header>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: aStyles.faint, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: aStyles.ink }}>{value}</div>
    </div>
  );
}

function HeroRowA({ room }) {
  const tiles = [
    { key: 'temp',     v: `${room.readings.temp.toFixed(1)}`, unit: '°C', label: 'Temperature', delta: '+0.4° in 1h', good: true },
    { key: 'humidity', v: `${room.readings.humidity}`, unit: '%', label: 'Humidity', delta: '−2 in 1h' },
    { key: 'co2',      v: `${room.readings.co2}`, unit: 'ppm', label: 'CO₂', delta: '+38 in 1h', warn: room.readings.co2 > 800 },
    { key: 'voc',      v: `${room.readings.voc}`, unit: 'idx', label: 'VOC index', delta: 'normal' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {tiles.map(t => (
        <div key={t.key} style={{
          background: aStyles.card, borderRadius: 8, padding: '16px 18px 14px',
          border: `1px solid ${aStyles.rule}`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: aStyles.muted }}>{t.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: aStyles.serif, fontSize: 52, lineHeight: 1, letterSpacing: '-0.02em' }}>{t.v}</span>
            <span style={{ fontSize: 13, color: aStyles.muted }}>{t.unit}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.warn ? aStyles.accent : aStyles.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: t.warn ? aStyles.accent : t.good ? aStyles.good : aStyles.faint }}></span>
            {t.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCardA({ room }) {
  const r = window.RUUVI;
  return (
    <div style={{
      flex: 1, minHeight: 0, background: aStyles.card, borderRadius: 8,
      border: `1px solid ${aStyles.rule}`, padding: '18px 22px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: aStyles.faint }}>Past 24 hours</div>
          <div style={{ fontFamily: aStyles.serif, fontSize: 22, marginTop: 2 }}>Indoor climate</div>
        </div>
        <div style={{ display: 'flex', gap: 4, fontSize: 11 }}>
          {['24h','7d','30d','All'].map((t, i) => (
            <div key={t} style={{
              padding: '5px 11px', borderRadius: 4,
              background: i === 0 ? aStyles.ink : 'transparent',
              color: i === 0 ? '#fff' : aStyles.muted,
              border: i === 0 ? 'none' : `1px solid ${aStyles.rule}`,
            }}>{t}</div>
          ))}
        </div>
      </div>

      <ChartA />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${aStyles.rule}`, paddingTop: 12, marginTop: 2 }}>
        <div style={{ display: 'flex', gap: 22 }}>
          {[
            { c: aStyles.ink,    k: 'temp' },
            { c: '#6b8caf',      k: 'humidity' },
            { c: aStyles.accent, k: 'co2' },
            { c: '#9a7a4f',      k: 'voc' },
          ].map(({ c, k }) => {
            const m = r.METRIC_META[k];
            const last = r.SERIES[k][r.SERIES[k].length - 1];
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 2, background: c }}></span>
                <span style={{ fontSize: 12, color: aStyles.muted }}>{m.label}</span>
                <span style={{ fontFamily: aStyles.serif, fontSize: 16, fontStyle: 'italic' }}>{m.fmt(last)}{m.unit && <span style={{ fontSize: 10, color: aStyles.muted, marginLeft: 2 }}>{m.unit}</span>}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: aStyles.faint, letterSpacing: '0.06em' }}>updated 12 sec ago</div>
      </div>
    </div>
  );
}

function ChartA() {
  const r = window.RUUVI;
  const w = 1100, h = 280, padX = 36, padY = 18;
  const norm = {
    temp: r.normalize(r.SERIES.temp, r.RANGES.temp),
    humidity: r.normalize(r.SERIES.humidity, r.RANGES.humidity),
    co2: r.normalize(r.SERIES.co2, r.RANGES.co2),
    voc: r.normalize(r.SERIES.voc, r.RANGES.voc),
  };
  const colors = { temp: aStyles.ink, humidity: '#6b8caf', co2: aStyles.accent, voc: '#9a7a4f' };

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={padX} x2={w - padX} y1={padY + (h - padY * 2) * v} y2={padY + (h - padY * 2) * v}
            stroke={aStyles.rule} strokeWidth="1" strokeDasharray={v === 0 || v === 1 ? '0' : '2 4'} />
        ))}
        {/* hour ticks */}
        {r.HOUR_TICKS.map(hh => {
          const x = padX + ((w - padX * 2) * hh) / 23;
          return (
            <g key={hh}>
              <line x1={x} x2={x} y1={h - padY} y2={h - padY + 4} stroke={aStyles.rule} strokeWidth="1" />
              <text x={x} y={h - 2} textAnchor="middle" fontSize="10" fill={aStyles.faint} fontFamily={aStyles.font}>
                {String(hh).padStart(2, '0')}:00
              </text>
            </g>
          );
        })}

        {/* CO2 area under for emphasis */}
        <path d={`${r.smoothPath(norm.co2, w, h, padX, padY)} L ${w - padX} ${h - padY} L ${padX} ${h - padY} Z`}
          fill={aStyles.accentSoft} opacity="0.45" />

        {Object.entries(norm).map(([k, vs]) => (
          <path key={k} d={r.smoothPath(vs, w, h, padX, padY)} fill="none"
            stroke={colors[k]} strokeWidth={k === 'temp' ? 1.6 : 1.2}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={k === 'temp' ? 1 : 0.85} />
        ))}

        {/* "now" marker at last point */}
        {Object.entries(norm).map(([k, vs]) => {
          const x = padX + (w - padX * 2);
          const y = padY + (h - padY * 2) * (1 - vs[vs.length - 1]);
          return <circle key={k} cx={x} cy={y} r="3" fill={colors[k]} stroke={aStyles.card} strokeWidth="1.5" />;
        })}
      </svg>
    </div>
  );
}

window.ArtboardA = ArtboardA;
