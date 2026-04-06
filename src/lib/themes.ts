export type ThemeId = 'dark' | 'light' | 'midnight' | 'ember';

export interface GraphTheme {
  id: ThemeId;
  label: string;
  // Canvas
  canvasBg: string;
  canvasBgGradientCenter: string;
  // Edges
  edgeColor: string;
  edgeHoverColor: string;
  // Labels
  labelColor: string;
  labelHoverColor: string;
  // Panel backgrounds
  panelBg: string;
  panelBorder: string;
  // Text
  textPrimary: string;
  textMuted: string;
  // UI elements
  inputBg: string;
  inputBorder: string;
  hoverBg: string;
  // Tooltip
  tooltipBg: string;
}

export const THEMES: Record<ThemeId, GraphTheme> = {
  dark: {
    id: 'dark',
    label: 'Dark',
    canvasBg: '#1a1a1a',
    canvasBgGradientCenter: '#222222',
    edgeColor: '#444444',
    edgeHoverColor: '#888888',
    labelColor: '#888888',
    labelHoverColor: '#cccccc',
    panelBg: '#1e1e1e',
    panelBorder: '#2d2d2d',
    textPrimary: '#cccccc',
    textMuted: '#666666',
    inputBg: '#252525',
    inputBorder: '#333333',
    hoverBg: '#2a2a2a',
    tooltipBg: 'rgba(22, 20, 18, 0.95)',
  },
  light: {
    id: 'light',
    label: 'Light',
    canvasBg: '#f5f5f5',
    canvasBgGradientCenter: '#ffffff',
    edgeColor: '#cccccc',
    edgeHoverColor: '#888888',
    labelColor: '#555555',
    labelHoverColor: '#222222',
    panelBg: '#ffffff',
    panelBorder: '#e0e0e0',
    textPrimary: '#333333',
    textMuted: '#999999',
    inputBg: '#f0f0f0',
    inputBorder: '#ddd',
    hoverBg: '#f0f0f0',
    tooltipBg: 'rgba(255, 255, 255, 0.95)',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    canvasBg: '#0d1117',
    canvasBgGradientCenter: '#161b22',
    edgeColor: '#2a3040',
    edgeHoverColor: '#6080b0',
    labelColor: '#6688aa',
    labelHoverColor: '#a0c0e0',
    panelBg: '#0d1117',
    panelBorder: '#21262d',
    textPrimary: '#c9d1d9',
    textMuted: '#484f58',
    inputBg: '#161b22',
    inputBorder: '#30363d',
    hoverBg: '#1c2128',
    tooltipBg: 'rgba(13, 17, 23, 0.95)',
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    canvasBg: '#1a1410',
    canvasBgGradientCenter: '#221c16',
    edgeColor: '#3d3328',
    edgeHoverColor: '#8a7560',
    labelColor: '#8a7e6d',
    labelHoverColor: '#c9b99a',
    panelBg: '#1a1410',
    panelBorder: '#2d2820',
    textPrimary: '#d4c8b8',
    textMuted: '#6a6050',
    inputBg: '#221c16',
    inputBorder: '#3a3228',
    hoverBg: '#2a2218',
    tooltipBg: 'rgba(26, 20, 16, 0.95)',
  },
};

// --- NODE COLORS ---
// Gemstone/jewel tones: luminous enough to glow on dark backgrounds,
// elegant enough to work on light ones. Each has distinct hue separation.

export const NODE_DOMAIN_COLORS: Record<string, string> = {
  ai: '#5B9BD5',         // sapphire blue — clear, trustworthy
  fashion: '#D4A853',    // rich gold — premium, Versali luxury
  academic: '#5BB88C',   // emerald — scholarly, vibrant
  business: '#9678B8',   // amethyst — strategic depth
  career: '#D4845A',     // amber — warm ambition
  engineering: '#4DBABA', // aquamarine — precise, technical
  meta: '#B87898',       // rose quartz — systems/meta
};

export const NODE_TYPE_COLORS: Record<string, string> = {
  skill: '#D4A853',      // gold
  agent: '#5BB88C',      // emerald
  report: '#5B9BD5',     // sapphire
  course: '#9678B8',     // amethyst
  note: '#D4845A',       // amber
  lecture: '#4DBABA',    // aquamarine
};

export function getTheme(id: ThemeId): GraphTheme {
  return THEMES[id] ?? THEMES.dark;
}
