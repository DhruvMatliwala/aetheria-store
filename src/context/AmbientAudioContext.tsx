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
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userMutedRef = useRef<boolean>(false);

  const startPlayback = () => {
    if (!audioRef.current || userMutedRef.current) return;
    const audio = audioRef.current;
    audio.volume = TARGET_VOLUME;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        // Autoplay policy pending user gesture
      });
  };

  useEffect(() => {
    // Instantiate persistent HTML5 Audio
    const audio = new Audio('/audio/ambient.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = TARGET_VOLUME;
    audioRef.current = audio;

    // 1. Direct attempt
    startPlayback();

    // 2. Global browser interaction triggers
    const handleFirstInteraction = () => {
      if (!userMutedRef.current && audioRef.current) {
        startPlayback();
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    document.addEventListener('click', handleFirstInteraction, { passive: true });

    return () => {
      cleanupListeners();
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
      setIsPlaying(true);
    } else {
      userMutedRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
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
