// Compose the design canvas with the three direction artboards.

function App() {
  return (
    <DesignCanvas
      title="Ruuvi · Atmos"
      subtitle="Windows desktop dashboard — three directions"
    >
      <DCSection
        id="directions"
        title="Direction explorations"
        subtitle="Same information architecture across three visual languages. Frameless 1280×800 window, sensor list on the left, big multi-metric chart on the right."
      >
        <DCArtboard id="a" label="A · Editorial Light" width={1280} height={800}>
          <ArtboardA />
        </DCArtboard>
        <DCArtboard id="b" label="B · Graphite Dark" width={1280} height={800}>
          <ArtboardB />
        </DCArtboard>
        <DCArtboard id="c" label="C · Swiss Mono" width={1280} height={800}>
          <ArtboardC />
        </DCArtboard>
        <DCArtboard id="d" label="D · Light × B layout" width={1280} height={800}>
          <ArtboardD />
        </DCArtboard>
      </DCSection>

      <DCPostIt x={40} y={-180} rotate={-2}>
        Living Room AIR selected in all three.<br/>
        Chart shows temp · humidity · CO₂ · VOC over 24h.<br/>
        Click a card's expand icon to view full-screen.
      </DCPostIt>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
