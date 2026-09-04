/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AETHERIA STORE — THEME ENGINE ARCHITECTURE
 * ══════════════════════════════════════════════════════════════════════════════
 * Centralized theme registry for the 3 crafted storefront designs.
 * 
 * 1. 'obsidian' : Aetheria Obsidian (Cinematic Scrollytelling — High-Res Image Engine)
 *    - 0% GPU load, instant load, ultra-smooth 60fps on mobile & budget devices.
 *    - Featured scenes: Mewtwo, Shibuya Pikachu, Ash-Greninja centered.
 * 
 * 2. 'motion'   : Aetheria Motion (Cinematic Scrollytelling — Live Looping Video Runway)
 *    - 1440p MP4 live-looping background videos.
 *    - Maximum cinematic motion for high-end desktop displays.
 * 
 * 3. 'nexus'    : Aetheria Nexus (Classic Modular E-Commerce Storefront)
 *    - Traditional vertical e-commerce layout.
 *    - Direct hero banner, feature grid, side-by-side plan cards, and FAQ accordion.
 * ══════════════════════════════════════════════════════════════════════════════
 */

export type StoreThemeId = 'obsidian' | 'motion' | 'nexus';

export interface ThemeMeta {
  id: StoreThemeId;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  mediaType: 'image' | 'video' | 'static-grid';
  badge: string;
}

export const THEME_REGISTRY: Record<StoreThemeId, ThemeMeta> = {
  obsidian: {
    id: 'obsidian',
    name: 'Aetheria Obsidian',
    codename: 'Cyber-Cinematic (Frames)',
    tagline: 'High-Res Frame Scrollytelling',
    description: 'AAA scrollytelling runway with zero GPU video load, butter-smooth 60fps mobile scroll, and precision-centered Pokémon scenes.',
    mediaType: 'image',
    badge: 'ACTIVE DEFAULT • 60FPS',
  },
  motion: {
    id: 'motion',
    name: 'Aetheria Motion',
    codename: 'Cyber-Cinematic (Live Motion)',
    tagline: '1440p Live Video Runway',
    description: 'The exact scrollytelling runway powered by live looping 1440p MP4 background videos for maximum desktop immersion.',
    mediaType: 'video',
    badge: 'BACKUP 1 • 1440P VIDEO',
  },
  nexus: {
    id: 'nexus',
    name: 'Aetheria Nexus',
    codename: 'Modular E-Commerce Grid',
    tagline: 'Classic Vertical Storefront',
    description: 'Traditional high-converting modular e-commerce layout with hero banner, feature showcase, side-by-side pricing tables, and FAQ accordion.',
    mediaType: 'static-grid',
    badge: 'BACKUP 2 • DIRECT GRID',
  },
};

/**
 * MASTER ACTIVE THEME
 * Change this single value to switch the active design site-wide:
 * 'obsidian' | 'motion' | 'nexus'
 */
export const ACTIVE_STORE_THEME: StoreThemeId = 'obsidian';

/**
 * Resolves the active theme with URL query parameter support.
 * Allows testing any theme via ?theme=obsidian | ?theme=motion | ?theme=nexus
 */
export function resolveStoreTheme(urlThemeParam?: string | null): StoreThemeId {
  if (!urlThemeParam) return ACTIVE_STORE_THEME;

  const normalized = urlThemeParam.toLowerCase().trim();
  if (normalized in THEME_REGISTRY) {
    return normalized as StoreThemeId;
  }

  // Handle common aliases
  if (normalized === 'image' || normalized === 'cinematic-image') return 'obsidian';
  if (normalized === 'video' || normalized === 'cinematic-video') return 'motion';
  if (normalized === 'static' || normalized === 'classic' || normalized === 'grid') return 'nexus';

  return ACTIVE_STORE_THEME;
}
