// Main app + tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "units": "C",
  "accent": "#bf5a30",
  "density": "comfortable",
  "theme": "light"
}/*EDITMODE-END*/;

const ACCENT_BY_HEX = {
  '#bf5a30': { hex: '#bf5a30', dim: 'rgba(191,90,48,0.10)',  edge: 'rgba(191,90,48,0.28)' },
  '#3f7a5a': { hex: '#3f7a5a', dim: 'rgba(63,122,90,0.10)',  edge: 'rgba(63,122,90,0.28)' },
  '#2b3a55': { hex: '#2b3a55', dim: 'rgba(43,58,85,0.10)',   edge: 'rgba(43,58,85,0.28)' },
  '#8a4a72': { hex: '#8a4a72', dim: 'rgba(138,74,114,0.10)', edge: 'rgba(138,74,114,0.28)' },
};

function PApp() {
  const r = window.RUUVI2;
  const tw = useTweaks(TWEAK_DEFAULTS);
  const [selectedId, setSelectedId] = React.useState('living');
  const [range, setRange] = React.useState('24h');

  const selected = r.ROOMS.find(x => x.id === selectedId) || r.ROOMS[0];
  const accent = ACCENT_BY_HEX[tw.values.accent] || ACCENT_BY_HEX['#bf5a30'];
  const palette = r.PALETTES[tw.values.theme] || r.PALETTES.light;
  const density = DENSITY[tw.values.density] || DENSITY.comfortable;

  const theme = {
    p: palette,
    a: accent,
    d: density,
    units: tw.values.units,
    warnHex: tw.values.theme === 'dark' ? '#e8a55c' : '#b8762a',
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{
        width: '100vw', height: '100vh', background: palette.bg, color: palette.ink,
        fontFamily: FONT, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'background 0.25s, color 0.25s',
      }}>
        <PWindowChrome room={selected} />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <PSidebar rooms={r.ROOMS} selectedId={selectedId} onSelect={setSelectedId} />
          <main style={{
            flex: 1, minWidth: 0, padding: `${24}px ${28}px ${26}px`,
            display: 'flex', flexDirection: 'column', gap: density.gap, overflow: 'hidden',
          }}>
            <PHeader room={selected} />
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
              <PChartCard room={selected} range={range} onRangeChange={setRange} />
              <PHeroStack room={selected} />
            </div>
          </main>
        </div>
      </div>

      <TweaksPanel title="Tweaks" noDeckControls>
        <TweakSection label="Display">
          <TweakRadio
            label="Theme"
            value={tw.values.theme}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
            onChange={v => tw.setTweak('theme', v)}
          />
          <TweakRadio
            label="Units"
            value={tw.values.units}
            options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
            onChange={v => tw.setTweak('units', v)}
          />
          <TweakRadio
            label="Density"
            value={tw.values.density}
            options={[{ value: 'comfortable', label: 'Comfy' }, { value: 'compact', label: 'Compact' }]}
            onChange={v => tw.setTweak('density', v)}
          />
        </TweakSection>

        <TweakSection label="Accent">
          <TweakColor
            label="Color"
            value={tw.values.accent}
            options={['#bf5a30', '#3f7a5a', '#2b3a55', '#8a4a72']}
            onChange={v => tw.setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Navigation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {r.ROOMS.map(room => (
              <button key={room.id} onClick={() => setSelectedId(room.id)} style={{
                background: room.id === selectedId ? 'rgba(0,0,0,0.06)' : 'transparent',
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 5,
                padding: '6px 10px', textAlign: 'left', cursor: 'pointer',
                fontSize: 12, color: '#222', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{room.name}</span>
                <span style={{ color: '#888', fontSize: 10, letterSpacing: '0.12em' }}>{room.kind.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </ThemeProvider>
  );
}

const protoRoot = ReactDOM.createRoot(document.getElementById('root'));
protoRoot.render(<PApp />);
