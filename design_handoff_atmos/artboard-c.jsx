// Artboard C — Swiss / Mono
// Strict grid, all-mono type, paper bg, hairline rules. Black, white, single red.

const cStyles = {
  font: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  paper: '#ededea',
  card: '#ffffff',
  ink: '#0a0a0a',
  muted: '#5a5a58',
  faint: '#9a9a96',
  rule: '#0a0a0a',
  hair: 'rgba(10,10,10,0.18)',
  accent: '#d83a2a',
  good: '#0a0a0a',
};

function ArtboardC() {
  const r = window.RUUVI;
  const W = 1280, H = 800;
  const selected = r.ROOMS.find(x => x.selected);

  return (
    <div style={{
      width: W, height: H, background: cStyles.paper, color: cStyles.ink,
      fontFamily: cStyles.font, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative', fontSize: 12,
    }}>
      <WindowChromeC />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
        <SidebarC rooms={r.ROOMS} />
        <main style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderLeft: `1px solid ${cStyles.rule}` }}>
          <HeaderC room={selected} />
          <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
            <HeroRowC room={selected} />
            <ChartCardC />
          </div>
        </main>
      </div>
    </div>
  );
}

function WindowChromeC() {
  return (
    <div style={{
      height: 32, display: 'flex', alignItems: 'stretch',
      borderBottom: `1px solid ${cStyles.rule}`, background: cStyles.ink, color: cStyles.paper,
      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
    }}>
      <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12, borderRight: `1px solid ${cStyles.paper}` }}>
        <div style={{ width: 10, height: 10, background: cStyles.accent }}></div>
        <span>ATMOS / 002</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 24 }}>
        <span style={{ color: cStyles.faint }}>FILE</span>
        <span style={{ color: cStyles.faint }}>VIEW</span>
        <span style={{ color: cStyles.faint }}>EXPORT</span>
        <span style={{ color: cStyles.faint }}>HELP</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, borderLeft: `1px solid ${cStyles.paper}` }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: cStyles.accent }}></span>
        REC · 24h
      </div>
      <div style={{ display: 'flex' }}>
        {['—','▢','×'].map((g, i) => (
          <div key={i} style={{
            width: 32, height: 32, display: 'grid', placeItems: 'center',
            borderLeft: `1px solid ${cStyles.paper}`, fontFamily: cStyles.sans, fontSize: 11,
          }}>{g}</div>
        ))}
      </div>
    </div>
  );
}

function SidebarC({ rooms }) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${cStyles.rule}` }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: cStyles.muted, marginBottom: 6 }}>INDEX / LOCATIONS</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: cStyles.sans, fontSize: 30, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em' }}>04</span>
          <span style={{ fontSize: 10, color: cStyles.muted }}>SENSORS · 1 AIR / 3 TEMP</span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {rooms.map((room, i) => <RoomRowC key={room.id} room={room} idx={i} last={i === rooms.length - 1} />)}
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${cStyles.rule}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: cStyles.muted, letterSpacing: '0.12em' }}>
        <span>+ ADD</span>
        <span>HUB · ONLINE</span>
      </div>
    </aside>
  );
}

function RoomRowC({ room, idx, last }) {
  const sel = room.selected;
  const isAir = room.kind === 'AIR';
  const co2 = room.readings.co2;
  return (
    <div style={{
      padding: '12px 16px', borderBottom: last ? 'none' : `1px solid ${cStyles.hair}`,
      background: sel ? cStyles.card : 'transparent', position: 'relative',
      cursor: 'pointer',
    }}>
      {sel && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cStyles.accent }}></div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 10, color: cStyles.faint }}>{String(idx + 1).padStart(2,'0')}</span>
          <span style={{ fontFamily: cStyles.sans, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{room.name}</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: '0.16em', color: isAir ? cStyles.accent : cStyles.muted }}>{room.kind.toUpperCase()}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, fontSize: 11, color: cStyles.muted }}>
        <span><span style={{ color: cStyles.ink }}>{room.readings.temp.toFixed(1)}</span>°C</span>
        <span><span style={{ color: cStyles.ink }}>{room.readings.humidity}</span>%</span>
        <span>
          {isAir
            ? <><span style={{ color: co2 > 800 ? cStyles.accent : cStyles.ink }}>{co2}</span> ppm</>
            : <><span style={{ color: cStyles.ink }}>{room.readings.pressure}</span> hPa</>}
        </span>
      </div>
    </div>
  );
}

function HeaderC({ room }) {
  return (
    <header style={{
      padding: '18px 28px 16px', borderBottom: `1px solid ${cStyles.rule}`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
    }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: cStyles.muted, marginBottom: 8 }}>
          02 · LOCATION / LIVING-ROOM / SENSOR-AIR
        </div>
        <h1 style={{
          margin: 0, fontFamily: cStyles.sans, fontSize: 48, fontWeight: 500,
          letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          {room.name}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${cStyles.rule}` }}>
        <MetaCellC label="LAST" value="00:12" />
        <MetaCellC label="BAT" value={`${room.battery}%`} />
        <MetaCellC label="RSSI" value={`${room.signal}`} />
        <MetaCellC label="FW" value="3.31.1" />
        <MetaCellC label="MAC" value="8F:2C:91" />
      </div>
    </header>
  );
}

function MetaCellC({ label, value }) {
  return (
    <div style={{ padding: '6px 12px 7px', borderLeft: `1px solid ${cStyles.hair}`, minWidth: 64 }}>
      <div style={{ fontSize: 9, color: cStyles.muted, letterSpacing: '0.18em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: cStyles.ink }}>{value}</div>
    </div>
  );
}

function HeroRowC({ room }) {
  const tiles = [
    { key: 'temp',     v: room.readings.temp.toFixed(1), unit: '°C',  label: 'TEMPERATURE', range: '19.2 / 22.1', tone: 'ok' },
    { key: 'humidity', v: room.readings.humidity,        unit: '%',   label: 'HUMIDITY',    range: '46 / 56',     tone: 'ok' },
    { key: 'co2',      v: room.readings.co2,             unit: 'PPM', label: 'CO₂',         range: '450 / 910',   tone: room.readings.co2 > 800 ? 'warn' : 'ok' },
    { key: 'voc',      v: room.readings.voc,             unit: 'IDX', label: 'VOC',         range: '16 / 38',     tone: 'ok' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${cStyles.rule}` }}>
      {tiles.map((t, i) => (
        <div key={t.key} style={{
          padding: '20px 24px 18px', borderRight: i < 3 ? `1px solid ${cStyles.hair}` : 'none',
          display: 'flex', flexDirection: 'column', gap: 6, background: cStyles.card,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', color: cStyles.muted }}>{t.label}</span>
            <span style={{ fontSize: 9, letterSpacing: '0.16em', color: t.tone === 'warn' ? cStyles.accent : cStyles.faint }}>
              {t.tone === 'warn' ? '↑ HIGH' : 'OK'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: cStyles.sans, fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1,
              color: t.tone === 'warn' ? cStyles.accent : cStyles.ink,
            }}>{t.v}</span>
            <span style={{ fontSize: 11, color: cStyles.muted, letterSpacing: '0.08em' }}>{t.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 10, color: cStyles.faint, letterSpacing: '0.08em' }}>24H · MIN/MAX {t.range}</span>
            <SparklineC metric={t.key} accent={t.tone === 'warn'} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SparklineC({ metric, accent }) {
  const r = window.RUUVI;
  const w = 60, h = 16;
  const norm = r.normalize(r.SERIES[metric]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={r.smoothPath(norm, w, h, 1, 2)} fill="none"
        stroke={accent ? cStyles.accent : cStyles.ink} strokeWidth="1"/>
    </svg>
  );
}

function ChartCardC() {
  const r = window.RUUVI;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: cStyles.card, minHeight: 0 }}>
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${cStyles.hair}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: cStyles.sans, fontSize: 18, fontWeight: 500 }}>Climate / 24h</span>
          <span style={{ fontSize: 10, color: cStyles.muted, letterSpacing: '0.16em' }}>FROM 2026-05-15 16:00 → 2026-05-16 16:00</span>
        </div>
        <div style={{ display: 'flex', gap: 0, fontSize: 10, letterSpacing: '0.14em' }}>
          {['1H','24H','7D','30D','MAX'].map((t, i) => (
            <div key={t} style={{
              padding: '5px 12px', borderRight: i < 4 ? `1px solid ${cStyles.hair}` : 'none',
              borderLeft: i === 0 ? `1px solid ${cStyles.hair}` : 'none',
              background: i === 1 ? cStyles.ink : 'transparent',
              color: i === 1 ? cStyles.paper : cStyles.muted,
            }}>{t}</div>
          ))}
        </div>
      </div>

      <ChartC />

      <div style={{
        borderTop: `1px solid ${cStyles.hair}`, padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 22, fontSize: 11, color: cStyles.muted }}>
          {[
            { c: cStyles.ink,    k: 'temp',     mark: '━' },
            { c: cStyles.ink,    k: 'humidity', mark: '┄' },
            { c: cStyles.accent, k: 'co2',      mark: '━' },
            { c: cStyles.ink,    k: 'voc',      mark: '┈' },
          ].map(({ c, k, mark }) => {
            const m = r.METRIC_META[k];
            const last = r.SERIES[k][r.SERIES[k].length - 1];
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: c, fontSize: 14 }}>{mark}</span>
                <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.label}</span>
                <span style={{ color: c === cStyles.accent ? cStyles.accent : cStyles.ink }}>{m.fmt(last)}{m.unit}</span>
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: 10, color: cStyles.faint, letterSpacing: '0.14em' }}>STREAM · ●</span>
      </div>
    </div>
  );
}

function ChartC() {
  const r = window.RUUVI;
  const w = 1040, h = 320, padX = 50, padY = 24;
  const norm = {
    temp: r.normalize(r.SERIES.temp, r.RANGES.temp),
    humidity: r.normalize(r.SERIES.humidity, r.RANGES.humidity),
    co2: r.normalize(r.SERIES.co2, r.RANGES.co2),
    voc: r.normalize(r.SERIES.voc, r.RANGES.voc),
  };

  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '4px 24px 0' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* outer frame */}
        <rect x={padX} y={padY} width={innerW} height={innerH} fill="none" stroke={cStyles.rule} strokeWidth="1"/>

        {/* horizontal ticks at quartiles */}
        {[0.25, 0.5, 0.75].map(v => (
          <line key={v} x1={padX} x2={w - padX} y1={padY + innerH * v} y2={padY + innerH * v}
            stroke={cStyles.hair} strokeWidth="1" strokeDasharray="2 4" />
        ))}

        {/* axis labels (left = temp, right = co2) */}
        {[24, 22, 20, 18].map((v, i) => (
          <text key={'ly' + i} x={padX - 8} y={padY + (innerH * i) / 3 + 3} textAnchor="end"
            fontSize="9" fill={cStyles.muted} letterSpacing="0.1em">{v}°</text>
        ))}
        {[1000, 800, 600, 400].map((v, i) => (
          <text key={'ry' + i} x={w - padX + 8} y={padY + (innerH * i) / 3 + 3} textAnchor="start"
            fontSize="9" fill={cStyles.muted} letterSpacing="0.1em">{v}</text>
        ))}

        {/* hour ticks */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map(hh => {
          const x = padX + (innerW * hh) / 23;
          return (
            <g key={hh}>
              <line x1={x} x2={x} y1={padY + innerH} y2={padY + innerH + 4} stroke={cStyles.rule} strokeWidth="1"/>
              <text x={x} y={padY + innerH + 16} textAnchor="middle" fontSize="9" fill={cStyles.muted} letterSpacing="0.1em">
                {String(hh).padStart(2,'0')}:00
              </text>
            </g>
          );
        })}

        {/* lines */}
        <path d={r.smoothPath(norm.humidity, w, h, padX, padY)} fill="none" stroke={cStyles.ink} strokeWidth="1" strokeDasharray="3 3" opacity="0.55"/>
        <path d={r.smoothPath(norm.voc, w, h, padX, padY)} fill="none" stroke={cStyles.ink} strokeWidth="1" strokeDasharray="1 3" opacity="0.55"/>
        <path d={r.smoothPath(norm.temp, w, h, padX, padY)} fill="none" stroke={cStyles.ink} strokeWidth="1.6"/>
        <path d={r.smoothPath(norm.co2, w, h, padX, padY)} fill="none" stroke={cStyles.accent} strokeWidth="1.6"/>

        {/* now line */}
        <line x1={padX + innerW} x2={padX + innerW} y1={padY} y2={padY + innerH} stroke={cStyles.ink} strokeWidth="1" strokeDasharray="2 2"/>
        <text x={padX + innerW - 4} y={padY + 10} textAnchor="end" fontSize="9" fill={cStyles.ink} letterSpacing="0.16em">NOW</text>

        {/* end markers */}
        {Object.entries(norm).map(([k, vs]) => {
          const x = padX + innerW;
          const y = padY + innerH * (1 - vs[vs.length - 1]);
          const color = k === 'co2' ? cStyles.accent : cStyles.ink;
          return <rect key={k} x={x - 3} y={y - 3} width="6" height="6" fill={color} />;
        })}
      </svg>
    </div>
  );
}

window.ArtboardC = ArtboardC;
