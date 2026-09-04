'use client';

import React from 'react';
import { StaticStorefrontExperience } from '@/components/storefront/StaticStorefrontExperience';
import { ThemeProps } from './AetheriaObsidian';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME 3: AETHERIA NEXUS (BACKUP 2)
 * ══════════════════════════════════════════════════════════════════════════════
 * - Engine: Classic Modular E-Commerce Storefront
 * - Visuals: Direct hero banner, trust strip, side-by-side plan cards,
 *            feature grid, how-it-works guide, and expandable FAQ accordion.
 * - Optimization: Traditional, high-converting vertical layout
 * ══════════════════════════════════════════════════════════════════════════════
 */
export function AetheriaNexus(props: ThemeProps) {
  return <StaticStorefrontExperience {...props} />;
}
