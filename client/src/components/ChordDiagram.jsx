export default function ChordDiagram({ chord, isActive }) {
  const strings = 6;
  const frets = 4;
  const cellSize = 14;
  const stringSpacing = cellSize;
  const fretSpacing = cellSize;
  const padLeft = cellSize;
  const padTop = 16;
  const width = padLeft + (strings - 1) * stringSpacing + 14;
  const height = padTop + frets * fretSpacing + 14;

  return (
    <div style={{
      display: 'inline-block',
      padding: '0.4rem 0.5rem',
      border: `2px solid ${isActive ? '#22c55e' : '#d1d5db'}`,
      borderRadius: '8px',
      backgroundColor: isActive ? '#f0fdf4' : '#f9fafb',
      transition: 'all 0.25s ease',
      transform: isActive ? 'scale(1.06)' : 'scale(1)',
      boxShadow: isActive ? '0 2px 8px rgba(34,197,94,0.3)' : 'none'
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.65rem', marginBottom: '2px' }}>
        {chord.name}
      </div>
      <svg width={width} height={height}>
        {/* Fret lines */}
        {Array.from({ length: frets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padLeft} y1={padTop + i * fretSpacing}
            x2={padLeft + (strings - 1) * stringSpacing} y2={padTop + i * fretSpacing}
            stroke="#9ca3af" strokeWidth={i === 0 ? 2.5 : 1}
          />
        ))}
        {/* String lines */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padLeft + i * stringSpacing} y1={padTop}
            x2={padLeft + i * stringSpacing} y2={padTop + frets * fretSpacing}
            stroke="#9ca3af" strokeWidth={1}
          />
        ))}
        {/* Finger dots */}
        {chord.fingers.map((finger, i) => {
          if (finger.fret === 0) return null;
          const x = padLeft + (6 - finger.string) * stringSpacing;
          const y = padTop + (finger.fret - 0.5) * fretSpacing;
          return <circle key={i} cx={x} cy={y} r={7} fill={isActive ? '#22c55e' : '#374151'} />;
        })}
        {/* Open string markers */}
        {chord.fingers.filter(f => f.fret === 0).map((finger, i) => {
          const x = padLeft + (6 - finger.string) * stringSpacing;
          return (
            <text key={i} x={x} y={padTop - 6} textAnchor="middle" fontSize="10" fill="#6b7280">○</text>
          );
        })}
      </svg>
    </div>
  );
}