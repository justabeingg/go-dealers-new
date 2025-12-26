// Go Dealers App Theme
// Modern, Professional, Fun Color Palette

export const COLORS = {
  // Primary Colors
  primary: '#8B5CF6',        // Purple - Main brand color
  primaryDark: '#7C3AED',    // Darker purple
  primaryLight: '#A78BFA',   // Lighter purple
  
  secondary: '#EC4899',      // Pink - Accent color
  secondaryDark: '#DB2777',  // Darker pink
  secondaryLight: '#F472B6', // Lighter pink
  
  accent: '#10B981',         // Green - Success/Active
  accentDark: '#059669',     // Darker green
  accentLight: '#34D399',    // Lighter green
  
  // Background Colors
  background: '#0F172A',     // Deep blue-gray (darkest)
  surface: '#1E293B',        // Blue-gray surface
  surfaceLight: '#334155',   // Lighter surface
  
  // Text Colors
  text: '#FFFFFF',           // Primary text
  textSecondary: '#94A3B8',  // Secondary text
  textMuted: '#64748B',      // Muted text
  
  // Border Colors
  border: '#334155',         // Default border
  borderLight: '#475569',    // Lighter border
  
  // Status Colors
  success: '#10B981',        // Success green
  error: '#EF4444',          // Error red
  warning: '#F59E0B',        // Warning orange
  info: '#3B82F6',           // Info blue
  
  // Functional
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const GRADIENTS = {
  primary: ['#8B5CF6', '#EC4899'],           // Purple to Pink
  primaryVertical: ['#8B5CF6', '#7C3AED'],   // Purple gradient
  background: ['#0F172A', '#1E293B', '#334155'], // Dark background
  success: ['#10B981', '#059669'],           // Green gradient
  card: ['#1E293B', '#334155'],              // Card gradient
}

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }),
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
}

export const FONT_SIZE = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
}

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
}
