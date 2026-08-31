'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface AmbientAudioContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
}

const AmbientAudioContext = createContext<AmbientAudioContextType>({
  isPlaying: false,
  togglePlay: () => {},
  volume: 0.25,
});

const TARGET_VOLUME = 0.25;
const FADE_DURATION_MS = 300;

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Instantiate persistent HTML5 Audio
    const audio = new Audio('/audio/ambient.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const fadeVolume = (targetVol: number, onComplete?: () => void) => {
    if (!audioRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const audio = audioRef.current;
    const startVol = audio.volume;
    const diff = targetVol - startVol;
    const steps = 20;
    const stepTime = FADE_DURATION_MS / steps;
    let stepCount = 0;

    fadeIntervalRef.current = setInterval(() => {
      stepCount += 1;
      const progress = stepCount / steps;
      const newVol = Math.max(0, Math.min(1, startVol + diff * progress));
      audio.volume = newVol;

      if (stepCount >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        audio.volume = targetVol;
        if (onComplete) onComplete();
      }
    }, stepTime);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      // Start Playing with 300ms fade-in to 0.25
      const audio = audioRef.current;
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          fadeVolume(TARGET_VOLUME);
        })
        .catch((err) => {
          console.warn('[AmbientAudio] Autoplay / user interaction required:', err);
        });
    } else {
      // Fade out to 0 over 300ms then pause
      fadeVolume(0, () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      });
      setIsPlaying(false);
    }
  };

  return (
    <AmbientAudioContext.Provider
      value={{
        isPlaying,
        togglePlay,
        volume: TARGET_VOLUME,
      }}
    >
      {children}
    </AmbientAudioContext.Provider>
  );
}

export function useAmbientAudio() {
  return useContext(AmbientAudioContext);
}
