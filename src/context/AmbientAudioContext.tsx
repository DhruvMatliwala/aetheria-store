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

  const startPlayback = (onSuccess?: () => void) => {
    if (!audioRef.current || userMutedRef.current) return;
    const audio = audioRef.current;
    audio.volume = TARGET_VOLUME;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          if (onSuccess) onSuccess();
        })
        .catch(() => {
          // Autoplay blocked: will trigger on next user tap/interaction
        });
    }
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

    // 2. Global browser interaction triggers that stay active until audio starts
    let unlocked = false;
    const handleFirstInteraction = () => {
      if (unlocked || userMutedRef.current || !audioRef.current) return;
      startPlayback(() => {
        unlocked = true;
        cleanupListeners();
      });
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('touchend', handleFirstInteraction);
    window.addEventListener('scroll', handleFirstInteraction);
    window.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('click', handleFirstInteraction);

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
