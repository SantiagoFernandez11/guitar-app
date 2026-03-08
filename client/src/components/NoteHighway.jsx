import { useEffect, useRef } from 'react';

const STRING_LABELS = ['Low E', 'A', 'D', 'G', 'B', 'High E'];
const HIGHWAY_WIDTH = 600;
const HIGHWAY_HEIGHT = 220;
const HIT_ZONE_X = 100;
const CHORD_LABEL_HEIGHT = 20;

export default function NoteHighway({ noteMap, currentTimeRef, speed, hitResults }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const hitResultsRef = useRef(hitResults);

  useEffect(() => {
    hitResultsRef.current = hitResults;
  }, [hitResults]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !noteMap || noteMap.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = HIGHWAY_WIDTH * dpr;
    canvas.height = HIGHWAY_HEIGHT * dpr;
    canvas.style.width = `${HIGHWAY_WIDTH}px`;
    canvas.style.height = `${HIGHWAY_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    const laneHeight = (HIGHWAY_HEIGHT - CHORD_LABEL_HEIGHT) / 6;
    const PIXELS_PER_MS = 0.15 * speed;

    const grouped = {};
    noteMap.forEach(n => {
      const key = String(n.timestamp);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(n);
    });

    const entries = Object.entries(grouped);

    const draw = () => {
      const currentTime = currentTimeRef.current;
      const hitRes = hitResultsRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, HIGHWAY_WIDTH, HIGHWAY_HEIGHT);

      // Chord label area
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, HIGHWAY_WIDTH, CHORD_LABEL_HEIGHT);

      // Lane backgrounds + labels
      for (let i = 0; i < 6; i++) {
        const laneY = CHORD_LABEL_HEIGHT + i * laneHeight;
        ctx.fillStyle = i % 2 === 0 ? '#141414' : '#111111';
        ctx.fillRect(0, laneY, HIGHWAY_WIDTH, laneHeight);

        ctx.strokeStyle = 'rgba(240,235,224,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(HIGHWAY_WIDTH, laneY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(240,235,224,0.2)';
        ctx.font = '10px DM Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(STRING_LABELS[i], 6, laneY + laneHeight / 2);
      }

      // Hit zone line
      ctx.strokeStyle = 'rgba(200,169,110,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(HIT_ZONE_X, 0);
      ctx.lineTo(HIT_ZONE_X, HIGHWAY_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw each timestamp group
      entries.forEach(([, notes]) => {
        const ts = notes[0].timestamp;
        const timeOffset = ts - currentTime;
        const x = HIT_ZONE_X + timeOffset * PIXELS_PER_MS;
        if (x < -40 || x > HIGHWAY_WIDTH + 40) return;

        const cx = Math.round(x);
        const isPast = timeOffset < -300;
        const chordName = notes[0]?.chord;

        // Chord label
        if (chordName) {
          ctx.font = '500 11px DM Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isPast ? 'rgba(240,235,224,0.1)' : 'rgba(200,169,110,0.7)';
          ctx.fillText(chordName, cx, CHORD_LABEL_HEIGHT / 2);
        }

        // Vertical connector
        const fingeredNotes = notes.filter(n => (n.type || 'fingered') === 'fingered');
        if (fingeredNotes.length > 1) {
          const sorted = [...fingeredNotes].sort((a, b) => b.string - a.string);
          const topY = Math.round(CHORD_LABEL_HEIGHT + (6 - sorted[0].string) * laneHeight + laneHeight / 2);
          const botY = Math.round(CHORD_LABEL_HEIGHT + (6 - sorted[sorted.length - 1].string) * laneHeight + laneHeight / 2);
          ctx.strokeStyle = isPast ? 'rgba(240,235,224,0.04)' : 'rgba(240,235,224,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, topY - 13);
          ctx.lineTo(cx, botY + 13);
          ctx.stroke();
        }

        // Draw each note
        notes.forEach(n => {
          const noteType = n.type || 'fingered';
          const laneY = CHORD_LABEL_HEIGHT + (6 - n.string) * laneHeight;
          const noteY = Math.round(laneY + laneHeight / 2);
          const key = `${n.timestamp}-${n.string}`;
          const result = hitRes?.[key];

          let strokeColor = isPast ? 'rgba(240,235,224,0.08)' : 'rgba(240,235,224,0.5)';
          let textColor = isPast ? 'rgba(240,235,224,0.15)' : 'rgba(240,235,224,0.9)';
          let fillColor = isPast ? '#0f0f0f' : '#1a1a1a';

          if (result === 'perfect') {
            strokeColor = 'rgba(200,169,110,0.9)';
            textColor = 'rgba(200,169,110,1)';
            fillColor = 'rgba(200,169,110,0.12)';
          } else if (result === 'good') {
            strokeColor = 'rgba(240,235,224,0.6)';
            textColor = 'rgba(240,235,224,0.8)';
            fillColor = 'rgba(240,235,224,0.08)';
          } else if (result === 'missed') {
            strokeColor = 'rgba(168,80,80,0.7)';
            textColor = 'rgba(168,80,80,0.8)';
            fillColor = 'rgba(168,80,80,0.08)';
          }

          if (noteType === 'fingered') {
            ctx.beginPath();
            ctx.arc(cx, noteY, 13, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = '500 10px DM Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(n.fret), cx, noteY);

          } else if (noteType === 'open') {
            ctx.fillStyle = isPast ? 'rgba(240,235,224,0.1)' : 'rgba(240,235,224,0.4)';
            ctx.font = '13px DM Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('o', cx, noteY);

          } else if (noteType === 'muted') {
            ctx.fillStyle = isPast ? 'rgba(240,235,224,0.08)' : 'rgba(240,235,224,0.25)';
            ctx.font = '13px DM Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x', cx, noteY);
          }
        });
      });

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [noteMap, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
}