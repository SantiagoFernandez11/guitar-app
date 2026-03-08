import { useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(frequency) {
  if (!frequency || frequency < 60) return null;
  const noteNum = 12 * (Math.log2(frequency / 440)) + 69;
  const rounded = Math.round(noteNum);
  const octave = Math.floor(rounded / 12) - 1;
  const noteName = NOTE_STRINGS[rounded % 12];
  return `${noteName}${octave}`;
}

function notesMatch(detected, expected) {
  if (!detected || !expected) return false;
  return detected.slice(0, -1) === expected.slice(0, -1);
}

export function useAudioScoring(noteMap) {
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [detectedNote, setDetectedNote] = useState(null);
  const [hitResults, setHitResults] = useState({});

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scoredTimestampsRef = useRef(new Set());
  const groupedRef = useRef({});

  const startListening = async (getCurrentTime) => {
    try {
      groupedRef.current = {};
      noteMap.forEach(n => {
        if (!groupedRef.current[n.timestamp]) groupedRef.current[n.timestamp] = [];
        groupedRef.current[n.timestamp].push(n);
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      detectorRef.current = detector;

      const buffer = new Float32Array(analyser.fftSize);
      scoredTimestampsRef.current = new Set();

      const detect = () => {
        analyser.getFloatTimeDomainData(buffer);
        const [frequency, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

        if (clarity > 0.7) {
          const note = frequencyToNote(frequency);
          setDetectedNote(note);

          const currentTime = getCurrentTime();
          const PERFECT_WINDOW = 150;
          const GOOD_WINDOW = 350;

          Object.entries(groupedRef.current).forEach(([ts, notes]) => {
            const timestamp = parseFloat(ts);
            if (scoredTimestampsRef.current.has(timestamp)) return;

            const diff = Math.abs(currentTime - timestamp);
            if (diff > GOOD_WINDOW) return;

            const fingeredNotes = notes.filter(n => n.type === 'fingered');
            const anyMatch = fingeredNotes.length === 0
              ? false
              : fingeredNotes.some(n => notesMatch(note, n.note));

            if (anyMatch) {
              scoredTimestampsRef.current.add(timestamp);
              const quality = diff <= PERFECT_WINDOW ? 'perfect' : 'good';
              const newResults = {};
              notes.forEach(n => {
                newResults[`${n.timestamp}-${n.string}`] = quality;
              });
              setHitResults(prev => ({ ...prev, ...newResults }));
              setHits(h => h + 1);
            }
          });

          Object.keys(groupedRef.current).forEach(ts => {
            const timestamp = parseFloat(ts);
            if (scoredTimestampsRef.current.has(timestamp)) return;
            if (getCurrentTime() > timestamp + GOOD_WINDOW) {
              scoredTimestampsRef.current.add(timestamp);
              const notes = groupedRef.current[timestamp];
              const newResults = {};
              notes.forEach(n => {
                newResults[`${n.timestamp}-${n.string}`] = 'missed';
              });
              setHitResults(prev => ({ ...prev, ...newResults }));
              setMisses(m => m + 1);
            }
          });
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  const stopListening = () => {
    cancelAnimationFrame(animationFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setDetectedNote(null);
  };

  const reset = () => {
    setHits(0);
    setMisses(0);
    setDetectedNote(null);
    setHitResults({});
    scoredTimestampsRef.current = new Set();
    groupedRef.current = {};
  };

  return { hits, misses, detectedNote, hitResults, startListening, stopListening, reset };
}