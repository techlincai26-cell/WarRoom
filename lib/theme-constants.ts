/**
 * War Room Design System - Theme Constants
 * Centralized design tokens for consistent styling across the application
 */

export const COLORS = {
  // Neutrals
  background: 'oklch(1 0 0)',
  backgroundDark: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.145 0 0)',
  foregroundLight: 'oklch(0.985 0 0)',
  card: 'oklch(1 0 0)',
  cardDark: 'oklch(0.145 0 0)',

  // Status Colors
  success: 'oklch(0.62 0.2 142)',
  successDark: 'oklch(0.45 0.15 142)',
  warning: 'oklch(0.75 0.2 85)',
  warningDark: 'oklch(0.56 0.18 85)',
  info: 'oklch(0.57 0.2 260)',
  infoDark: 'oklch(0.44 0.18 260)',
  error: 'oklch(0.577 0.245 27.325)',
  errorDark: 'oklch(0.396 0.141 25.723)',

  // Interactive
  primary: 'oklch(0.205 0 0)',
  primaryLight: 'oklch(0.985 0 0)',
  muted: 'oklch(0.97 0 0)',
  mutedDark: 'oklch(0.269 0 0)',
  border: 'oklch(0.922 0 0)',
  borderDark: 'oklch(0.269 0 0)',
  input: 'oklch(0.922 0 0)',
  inputDark: 'oklch(0.269 0 0)',

  // Chart Colors
  chart: {
    1: 'oklch(0.646 0.222 41.116)',
    2: 'oklch(0.6 0.118 184.704)',
    3: 'oklch(0.398 0.07 227.392)',
    4: 'oklch(0.828 0.189 84.429)',
    5: 'oklch(0.769 0.188 70.08)',
  },
} as const

export const TYPOGRAPHY = {
  // Font families
  fontSans: "'Geist', 'Geist Fallback', system-ui, sans-serif",
  fontMono: "'Geist Mono', 'Geist Mono Fallback', monospace",

  // Font sizes (in rem)
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

export const SPACING = {
  // Tailwind spacing scale (in rem)
  0: '0',
  1: '0.25rem',      // 4px
  2: '0.5rem',       // 8px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
} as const

export const RADIUS = {
  none: '0',
  sm: 'calc(0.625rem - 4px)',   // 6px
  md: 'calc(0.625rem - 2px)',   // 8px
  lg: '0.625rem',               // 10px
  xl: 'calc(0.625rem + 4px)',   // 14px
} as const

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const

export const TRANSITIONS = {
  // Duration in milliseconds
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * Component Size Variants
 */
export const BUTTON_SIZES = {
  xs: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    height: '24px',
  },
  sm: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    height: '32px',
  },
  md: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    height: '40px',
  },
  lg: {
    padding: '0.75rem 1.5rem',
    fontSize: '1.125rem',
    height: '48px',
  },
  xl: {
    padding: '1rem 2rem',
    fontSize: '1.25rem',
    height: '56px',
  },
} as const

export const INPUT_SIZES = {
  sm: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    height: '32px',
  },
  md: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    height: '40px',
  },
  lg: {
    padding: '0.75rem 1rem',
    fontSize: '1.125rem',
    height: '48px',
  },
} as const

/**
 * Semantic Color Aliases
 */
export const SEMANTIC_COLORS = {
  // Usage-based color naming
  page: { background: COLORS.background, text: COLORS.foreground },
  card: { background: COLORS.card, text: COLORS.foreground, border: COLORS.border },
  input: { background: COLORS.input, text: COLORS.foreground, border: COLORS.border },
  button: {
    primary: { background: COLORS.primary, text: COLORS.primaryLight },
    secondary: { background: COLORS.card, text: COLORS.foreground, border: COLORS.border },
  },
  badge: {
    success: { background: COLORS.success, text: COLORS.backgroundDark },
    warning: { background: COLORS.warning, text: COLORS.backgroundDark },
    error: { background: COLORS.error, text: COLORS.foregroundLight },
    info: { background: COLORS.info, text: COLORS.foregroundLight },
  },
  status: {
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.info,
  },
} as const

/**
 * Dark Mode Color Variants
 */
export const DARK_MODE_COLORS = {
  background: COLORS.backgroundDark,
  foreground: COLORS.foregroundLight,
  card: COLORS.cardDark,
  muted: COLORS.mutedDark,
  border: COLORS.borderDark,
  input: COLORS.inputDark,
  success: COLORS.successDark,
  warning: COLORS.warningDark,
  info: COLORS.infoDark,
  error: COLORS.errorDark,
} as const
