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
      padding: '6px 8px',
      border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      background: isActive ? 'var(--accent-glow)' : 'var(--bg-elevated)',
      transition: 'all 0.2s ease',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      flexShrink: 0,
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: '500',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        marginBottom: '4px',
        letterSpacing: '0.05em',
      }}>
        {chord.name}
      </div>
      <svg width={width} height={height}>
        {/* Fret lines */}
        {Array.from({ length: frets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padLeft} y1={padTop + i * fretSpacing}
            x2={padLeft + (strings - 1) * stringSpacing} y2={padTop + i * fretSpacing}
            stroke={i === 0 ? 'rgba(240,235,224,0.2)' : 'rgba(240,235,224,0.06)'}
            strokeWidth={i === 0 ? 2 : 1}
          />
        ))}
        {/* String lines */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padLeft + i * stringSpacing} y1={padTop}
            x2={padLeft + i * stringSpacing} y2={padTop + frets * fretSpacing}
            stroke="rgba(240,235,224,0.08)"
            strokeWidth={1}
          />
        ))}
        {/* Finger dots */}
        {chord.fingers.map((finger, i) => {
          if (finger.fret === 0) return null;
          const x = padLeft + (6 - finger.string) * stringSpacing;
          const y = padTop + (finger.fret - 0.5) * fretSpacing;
          return (
            <circle key={i} cx={x} cy={y} r={6}
              fill={isActive ? 'rgba(200,169,110,0.8)' : 'rgba(240,235,224,0.15)'}
              stroke={isActive ? 'var(--accent)' : 'rgba(240,235,224,0.2)'}
              strokeWidth={1}
            />
          );
        })}
        {/* Open string markers */}
        {chord.fingers.filter(f => f.fret === 0).map((finger, i) => {
          const x = padLeft + (6 - finger.string) * stringSpacing;
          return (
            <text key={i} x={x} y={padTop - 5} textAnchor="middle" fontSize="9"
              fill={isActive ? 'rgba(200,169,110,0.7)' : 'rgba(240,235,224,0.2)'}>
              ○
            </text>
          );
        })}
      </svg>
    </div>
  );
}