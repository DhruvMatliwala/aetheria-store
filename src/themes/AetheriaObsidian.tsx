'use client';

import React from 'react';
import { CinematicScrollExperience } from '@/components/CinematicScrollExperience';
import { Plan } from '@/types/plan';

export interface ThemeProps {
  stockCounts?: Record<string, number>;
  onBuyClick: (plan: Plan) => void;
  onNotifyClick: (plan: Plan) => void;
  waitlistedPlans?: Record<string, boolean>;
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME 1: AETHERIA OBSIDIAN (ACTIVE DEFAULT)
 * ══════════════════════════════════════════════════════════════════════════════
 * - Engine: High-Resolution Paused Video Frame Scrollytelling (0% GPU video load)
 * - Visuals: Mewtwo, Shibuya Crossing Pikachu, Ash-Greninja centered with glowing shuriken
 * - Optimization: Butter-smooth 60fps on all mobile and low-end devices
 * ══════════════════════════════════════════════════════════════════════════════
 */
export function AetheriaObsidian(props: ThemeProps) {
  return (
    <CinematicScrollExperience
      {...props}
      mediaMode="image"
    />
  );
}
