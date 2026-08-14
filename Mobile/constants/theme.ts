export const TaskFlowTheme = {
  colors: {
    midnight: '#070B16',
    navySurface: '#0D1424',
    raisedSurface: '#121B2E',
    primary: '#7448FF',
    primaryGlow: '#9A6BFF',
    secondary: '#4B8DFF',
    success: '#3DDB82',
    warning: '#F4A340',
    error: '#FF5F72',
    text: '#F7F8FC',
    muted: '#8D98AE',
    border: '#202B42',
    divider: '#182239',
  },
  typography: {
    display: 30,
    title: 20,
    section: 16,
    body: 14,
    caption: 11,
    metadata: 10,
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  shadows: {
    card: { shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
    glow: { shadowColor: '#7448FF', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  },
} as const;

export const Colors = {
  light: {
    text: TaskFlowTheme.colors.text,
    foreground: TaskFlowTheme.colors.text,
    background: TaskFlowTheme.colors.midnight,
    tint: TaskFlowTheme.colors.primary,
    icon: TaskFlowTheme.colors.muted,
    tabIconDefault: TaskFlowTheme.colors.muted,
    tabIconSelected: TaskFlowTheme.colors.primary,
    primary: TaskFlowTheme.colors.primary,
    surface: TaskFlowTheme.colors.navySurface,
    border: TaskFlowTheme.colors.border,
    muted: TaskFlowTheme.colors.muted,
    success: TaskFlowTheme.colors.success,
    warning: TaskFlowTheme.colors.warning,
    error: TaskFlowTheme.colors.error,
  },
  dark: {
    text: TaskFlowTheme.colors.text,
    foreground: TaskFlowTheme.colors.text,
    background: TaskFlowTheme.colors.midnight,
    tint: TaskFlowTheme.colors.primary,
    icon: TaskFlowTheme.colors.muted,
    tabIconDefault: TaskFlowTheme.colors.muted,
    tabIconSelected: TaskFlowTheme.colors.primary,
    primary: TaskFlowTheme.colors.primary,
    surface: TaskFlowTheme.colors.navySurface,
    border: TaskFlowTheme.colors.border,
    muted: TaskFlowTheme.colors.muted,
    success: TaskFlowTheme.colors.success,
    warning: TaskFlowTheme.colors.warning,
    error: TaskFlowTheme.colors.error,
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColorPalette = (typeof Colors)[ColorScheme];
export const SchemeColors = Colors;
export type SchemeColorsType = ThemeColorPalette;
