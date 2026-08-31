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
  const userMutedRef = useRef<boolean>(false);

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

  const startPlayback = () => {
    if (!audioRef.current || userMutedRef.current) return;
    const audio = audioRef.current;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        fadeVolume(TARGET_VOLUME);
      })
      .catch(() => {
        // Handled via user interaction fallback
      });
  };

  useEffect(() => {
    // Instantiate persistent HTML5 Audio
    const audio = new Audio('/audio/ambient.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    // 1. Direct autoplay attempt
    startPlayback();

    // 2. Browser interaction fallback (first tap or scroll)
    const handleFirstInteraction = () => {
      if (!userMutedRef.current && audioRef.current && audioRef.current.paused) {
        startPlayback();
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      userMutedRef.current = false;
      startPlayback();
    } else {
      userMutedRef.current = true;
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
