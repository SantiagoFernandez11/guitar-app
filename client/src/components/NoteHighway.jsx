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

    // Group notes by timestamp
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
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, HIGHWAY_WIDTH, CHORD_LABEL_HEIGHT);

      // Lane backgrounds + labels
      for (let i = 0; i < 6; i++) {
        const laneY = CHORD_LABEL_HEIGHT + i * laneHeight;
        ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#111827';
        ctx.fillRect(0, laneY, HIGHWAY_WIDTH, laneHeight);

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(HIGHWAY_WIDTH, laneY);
        ctx.stroke();

        ctx.fillStyle = '#4b5563';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(STRING_LABELS[i], 6, laneY + laneHeight / 2);
      }

      // Hit zone line
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
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

        // Chord label in top bar
        if (chordName) {
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isPast ? '#374151' : '#e5e7eb';
          ctx.fillText(chordName, cx, CHORD_LABEL_HEIGHT / 2);
        }

        // Vertical connector between fingered notes
        const fingeredNotes = notes.filter(n => (n.type || 'fingered') === 'fingered');
        if (fingeredNotes.length > 1) {
          const sorted = [...fingeredNotes].sort((a, b) => b.string - a.string);
          const topY = Math.round(CHORD_LABEL_HEIGHT + (6 - sorted[0].string) * laneHeight + laneHeight / 2);
          const botY = Math.round(CHORD_LABEL_HEIGHT + (6 - sorted[sorted.length - 1].string) * laneHeight + laneHeight / 2);
          ctx.strokeStyle = isPast ? '#374151' : 'rgba(255,255,255,0.15)';
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

          let strokeColor = isPast ? '#4b5563' : '#ffffff';
          let textColor = isPast ? '#4b5563' : '#ffffff';
          let fillColor = '#1f2937';

          if (result === 'perfect') {
            strokeColor = '#22c55e'; textColor = '#22c55e'; fillColor = '#14532d';
          } else if (result === 'good') {
            strokeColor = '#f97316'; textColor = '#f97316'; fillColor = '#7c2d12';
          } else if (result === 'missed') {
            strokeColor = '#ef4444'; textColor = '#ef4444'; fillColor = '#7f1d1d';
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
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(n.fret), cx, noteY);

          } else if (noteType === 'open') {
            ctx.fillStyle = isPast ? '#374151' : '#9ca3af';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('o', cx, noteY);

          } else if (noteType === 'muted') {
            ctx.fillStyle = isPast ? '#374151' : '#6b7280';
            ctx.font = '13px sans-serif';
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
      style={{ borderRadius: '12px', display: 'block', margin: '0 auto' }}
    />
  );
}