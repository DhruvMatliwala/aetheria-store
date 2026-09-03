'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface AmbientAudioContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
}

const TARGET_VOLUME = 0.25;

const AmbientAudioContext = createContext<AmbientAudioContextType>({
  isPlaying: false,
  togglePlay: () => {},
  volume: TARGET_VOLUME,
});

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userMutedRef = useRef<boolean>(false);

  // Play audio safely
  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userMutedRef.current) return;

    audio.volume = TARGET_VOLUME;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Autoplay blocked by browser policy until user interacts
        });
    }
  }, []);

  // Initialize persistent HTML5 Audio ONCE on mount
  useEffect(() => {
    const audio = new Audio('/audio/ambient.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = TARGET_VOLUME;
    audioRef.current = audio;

    // 1. Initial attempt
    playAudio();

    // 2. Browser interaction trigger (unlocks audio on first tap/scroll anywhere)
    let unlocked = false;
    const handleFirstInteraction = () => {
      if (unlocked || userMutedRef.current || !audioRef.current) return;
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          unlocked = true;
          setIsPlaying(true);
          cleanupListeners();
        }).catch(() => {});
      }
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });

    // 3. Tab Visibility handling
    let wasPlayingBeforeHidden = false;
    const handleVisibilityChange = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        wasPlayingBeforeHidden = !a.paused;
        a.pause();
        setIsPlaying(false);
      } else if (!userMutedRef.current && wasPlayingBeforeHidden) {
        a.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    // 4. Page hide
    const handlePageHide = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cleanupListeners();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [playAudio]); // Only runs ONCE on mount

  // Instant zero-lag toggle button handler
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      userMutedRef.current = false;
      audio.volume = TARGET_VOLUME;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});
    } else {
      userMutedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

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
