export type ThemeId = 'cosmos' | 'dark' | 'light' | 'midnight' | 'ember';

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
  cosmos: {
    id: 'cosmos',
    label: 'Cosmos',
    canvasBg: '#0a0e1a',
    canvasBgGradientCenter: '#0e1225',
    edgeColor: '#c8962a',
    edgeHoverColor: '#e8b84a',
    labelColor: '#5a6a88',
    labelHoverColor: '#c8d0e0',
    panelBg: '#0d1220',
    panelBorder: '#1a2540',
    textPrimary: '#c8d0e0',
    textMuted: '#4a5570',
    inputBg: '#101828',
    inputBorder: '#1e2e4a',
    hoverBg: '#141e30',
    tooltipBg: 'rgba(10, 14, 26, 0.95)',
  },
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

// Nebula palette — high-saturation astronomical colors
// Each hue is 45-55° apart for maximum distinguishability at any node size
export const NODE_DOMAIN_COLORS: Record<string, string> = {
  ai: '#4a90ff',
  fashion: '#e8b84a',
  academic: '#3dd68c',
  business: '#9070e0',
  career: '#e05050',
  engineering: '#40d8e0',
  meta: '#e060a0',
};

export const NODE_TYPE_COLORS: Record<string, string> = {
  skill: '#e8b84a',
  agent: '#3dd68c',
  report: '#4a90ff',
  course: '#9070e0',
  note: '#e05050',
  lecture: '#40d8e0',
};

export function getTheme(id: ThemeId): GraphTheme {
  return THEMES[id] ?? THEMES.dark;
}
