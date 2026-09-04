'use client';

import React from 'react';
import { CinematicScrollExperience } from '@/components/CinematicScrollExperience';
import { ThemeProps } from './AetheriaObsidian';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME 2: AETHERIA MOTION (BACKUP 1)
 * ══════════════════════════════════════════════════════════════════════════════
 * - Engine: Live Looping 1440p MP4 Video Scrollytelling Runway
 * - Visuals: Full high-motion looping videos with anticipatory lookahead prewarmer
 * - Optimization: Maximum cinematic immersion for high-end desktop displays
 * ══════════════════════════════════════════════════════════════════════════════
 */
export function AetheriaMotion(props: ThemeProps) {
  return (
    <CinematicScrollExperience
      {...props}
      mediaMode="video"
    />
  );
}
