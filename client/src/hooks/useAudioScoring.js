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
  // Compare just the note name without octave for more forgiving matching
  return detected.slice(0, -1) === expected.slice(0, -1);
}

export function useAudioScoring(noteMap) {
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [detectedNote, setDetectedNote] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scoredTimestampsRef = useRef(new Set());

  const startListening = async (getCurrentTime) => {
    try {
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

      setIsListening(true);

      const detect = () => {
        analyser.getFloatTimeDomainData(buffer);
        const [frequency, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

        if (clarity > 0.7) {
          const note = frequencyToNote(frequency);
          setDetectedNote(note);

          // Score against note map
          const currentTime = getCurrentTime();
          const TIMING_WINDOW = 300;

          noteMap.forEach(n => {
            if (scoredTimestampsRef.current.has(n.timestamp)) return;
            const inWindow = currentTime >= n.timestamp - TIMING_WINDOW &&
                             currentTime <= n.timestamp + TIMING_WINDOW;
            if (inWindow) {
              scoredTimestampsRef.current.add(n.timestamp);
              if (notesMatch(note, n.note)) {
                setHits(h => h + 1);
              } else {
                setMisses(m => m + 1);
              }
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
    setIsListening(false);
    setDetectedNote(null);
  };

  const reset = () => {
    setHits(0);
    setMisses(0);
    setDetectedNote(null);
    scoredTimestampsRef.current = new Set();
  };

  return { hits, misses, detectedNote, isListening, startListening, stopListening, reset };
}