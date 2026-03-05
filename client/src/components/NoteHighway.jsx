import { useEffect, useRef } from 'react';

const STRING_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
const STRING_LABELS = ['Low E', 'A', 'D', 'G', 'B', 'High E'];

const HIGHWAY_WIDTH = 600;
const HIGHWAY_HEIGHT = 200;
const HIT_ZONE_X = 100;

export default function NoteHighway({ noteMap, currentTimeRef, speed }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = HIGHWAY_WIDTH * dpr;
    canvas.height = HIGHWAY_HEIGHT * dpr;
    canvas.style.width = `${HIGHWAY_WIDTH}px`;
    canvas.style.height = `${HIGHWAY_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    const laneHeight = HIGHWAY_HEIGHT / 6;
    const PIXELS_PER_MS = 0.15 * speed;

    const draw = () => {
      const currentTime = currentTimeRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, HIGHWAY_WIDTH, HIGHWAY_HEIGHT);

      // Lanes
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#111827';
        ctx.fillRect(0, i * laneHeight, HIGHWAY_WIDTH, laneHeight);

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, i * laneHeight);
        ctx.lineTo(HIGHWAY_WIDTH, i * laneHeight);
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(STRING_LABELS[i], 6, i * laneHeight + laneHeight / 2);
      }

      // Hit zone
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(HIT_ZONE_X, 0);
      ctx.lineTo(HIT_ZONE_X, HIGHWAY_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      const gradient = ctx.createLinearGradient(HIT_ZONE_X - 24, 0, HIT_ZONE_X + 24, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.07)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(HIT_ZONE_X - 24, 0, 48, HIGHWAY_HEIGHT);

      // Notes
      noteMap.forEach(n => {
        const timeOffset = n.timestamp - currentTime;
        const x = HIT_ZONE_X + timeOffset * PIXELS_PER_MS;
        if (x < -30 || x > HIGHWAY_WIDTH + 30) return;

        const laneY = (6 - n.string) * laneHeight;
        const noteY = laneY + laneHeight / 2;
        const color = STRING_COLORS[n.string - 1] || '#ffffff';
        const isPast = timeOffset < -200;
        const cx = Math.round(x);
        const cy = Math.round(noteY);

        ctx.shadowColor = isPast ? 'transparent' : color;
        ctx.shadowBlur = isPast ? 0 : 6;

        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.fillStyle = isPast ? '#2d3748' : color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = isPast ? '#4a5568' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isPast ? '#718096' : '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n.fret), cx, cy);
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