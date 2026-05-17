// Prototype UI components.
// Theme context drives palette / accent / density / units. All components
// read from useTheme(); they don't take styling props directly.

const ThemeCtx = React.createContext(null);
const useTheme = () => React.useContext(ThemeCtx);

function ThemeProvider({ theme, children }) {
  return React.createElement(ThemeCtx.Provider, { value: theme }, children);
}

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

// Density tokens. compact halves card padding and shrinks hero numerals.
const DENSITY = {
  comfortable: { gap: 18, cardPad: 16, tilePad: '16px 20px', tileSmallPad: '12px 18px', heroBig: 46, heroSmall: 26 },
  compact:     { gap: 12, cardPad: 12, tilePad: '12px 16px', tileSmallPad: '10px 14px', heroBig: 38, heroSmall: 22 },
};

// ── Window chrome ─────────────────────────────────────────────────────────

function PWindowChrome({ room }) {
  const t = useTheme();
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'center', padding: '0 14px',
      background: t.p.bg, borderBottom: `1px solid ${t.p.rule}`,
      fontFamily: MONO, fontSize: 11, color: t.p.muted, letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,4px)', gap: 2 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 4, height: 4, background: i === 0 ? t.a.hex : t.p.ink, borderRadius: 0.5,
            }}></div>
          ))}
        </div>
        <span style={{ color: t.p.ink }}>ATMOS</span>
        <span style={{ color: t.p.faint }}>/</span>
        <span>home/{room?.id || ''}</span>
      </div>
      <div style={{ flex: 1 }}></div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 18 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: t.a.hex,
          boxShadow: `0 0 6px ${t.a.hex}80` }}></span>
        live · 1s
      </span>
      <div style={{ display: 'flex' }}>
        {['min','max','close'].map((k, i) => (
          <button key={k} style={{
            width: 32, height: 24, display: 'grid', placeItems: 'center', color: t.p.muted,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            {i === 0 && <div style={{ width: 10, height: 1, background: 'currentColor' }}></div>}
            {i === 1 && <div style={{ width: 9, height: 9, border: '1px solid currentColor' }}></div>}
            {i === 2 && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1"/></svg>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────

function PSidebar({ rooms, selectedId, onSelect }) {
  const t = useTheme();
  return (
    <aside style={{
      width: 256, flexShrink: 0, padding: '20px 14px 16px',
      borderRight: `1px solid ${t.p.rule}`, background: t.p.sidebar,
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: t.p.faint, letterSpacing: '0.18em' }}>LOCATIONS</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: t.p.muted }}>{rooms.length}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rooms.map(room => (
          <PRoomCard key={room.id} room={room} selected={room.id === selectedId} onClick={() => onSelect(room.id)} />
        ))}
      </div>
      <button style={{
        marginTop: 4, background: 'transparent', border: `1px solid ${t.p.ruleStrong}`,
        borderRadius: 4, padding: '8px 10px', color: t.p.muted, fontFamily: MONO,
        fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase',
      }}>+ Pair sensor</button>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: MONO, fontSize: 10, color: t.p.muted }}>
        <SidebarStat label="HUB" value="online · 192.168.1.42" />
        <SidebarStat label="GATEWAY" value="ble · 2 dropped/24h" />
      </div>
    </aside>
  );
}

function SidebarStat({ label, value }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: t.p.faint, letterSpacing: '0.14em' }}>{label}</span>
      <span style={{ color: t.p.muted }}>{value}</span>
    </div>
  );
}

function PRoomCard({ room, selected, onClick }) {
  const t = useTheme();
  const r = window.RUUVI2;
  const isAir = room.kind === 'AIR';
  const temp = r.latest(room, 'temp');
  const tempD = r.toUnit(temp, 'temp', t.units);
  const hum = r.latest(room, 'humidity');
  const co2 = r.latest(room, 'co2');
  const pressure = r.latest(room, 'pressure');
  const co2Tone = co2 != null && r.tone('co2', co2);

  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: '12px 12px 10px', borderRadius: 6,
      background: selected ? t.p.surface : 'transparent',
      border: selected ? `1px solid ${t.p.rule}` : `1px solid transparent`,
      boxShadow: selected ? `0 1px 0 ${t.p.rule}` : 'none',
      cursor: 'pointer', position: 'relative', fontFamily: FONT, color: 'inherit',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: isAir ? t.a.hex : t.p.muted,
          }}></span>
          <span style={{ fontSize: 13, color: selected ? t.p.ink : t.p.muted, fontWeight: selected ? 500 : 400 }}>{room.name}</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9, color: t.p.faint, letterSpacing: '0.12em' }}>{room.kind.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontFamily: MONO, fontSize: 11, color: t.p.muted }}>
        <span style={{ color: t.p.ink }}>{tempD.toFixed(1)}°</span>
        <span>{Math.round(hum)}%rh</span>
        {isAir && <span style={{ color: co2Tone === 'warn' || co2Tone === 'bad' ? t.warnHex : t.p.muted }}>{Math.round(co2)}ppm</span>}
        {!isAir && <span>{Math.round(pressure)}hPa</span>}
      </div>
      {selected && <div style={{ position: 'absolute', left: -1, top: 12, bottom: 12, width: 2, background: t.a.hex, borderRadius: 2 }}></div>}
    </button>
  );
}

// ── Header ──────────────────────────────────────────────────────────────

function PHeader({ room }) {
  const t = useTheme();
  return (
    <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: t.p.faint, letterSpacing: '0.18em', marginBottom: 8 }}>
          RUUVI · {room.kind.toUpperCase()} · ID {room.mac}
        </div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em' }}>{room.name}</h1>
      </div>
      <div style={{ display: 'flex', gap: 22, fontFamily: MONO, fontSize: 10, color: t.p.muted, letterSpacing: '0.04em' }}>
        <PMeta label="LAST" value="12 SEC" />
        <PMeta label="BATTERY" value={`${room.battery}%`} bar={room.battery} />
        <PMeta label="RSSI" value={`${room.signal} dBm`} />
        <PMeta label="FW" value={room.fw} />
      </div>
    </header>
  );
}

function PMeta({ label, value, bar }) {
  const t = useTheme();
  return (
    <div style={{ minWidth: 70 }}>
      <div style={{ fontSize: 9, color: t.p.faint, letterSpacing: '0.18em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: t.p.ink, marginBottom: bar ? 4 : 0 }}>{value}</div>
      {bar !== undefined && (
        <div style={{ height: 2, background: t.p.rule, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${bar}%`, height: '100%', background: t.a.hex, transition: 'width 0.3s' }}></div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ThemeProvider, useTheme, PWindowChrome, PSidebar, PHeader, FONT, MONO, DENSITY });
