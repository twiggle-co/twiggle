/**
 * Twiggle Color Palette
 * 
 * Centralized color definitions for the application.
 * Based on Coolors palette: https://coolors.co/palette/ef476f-ffd166-06d6a0-118ab2-eeeeee
 */

export const colors = {
  // Primary Colors
  red: '#ef476f',
  yellow: '#ffd166',
  green: '#06d6a0',
  blue: '#118ab2',
  gray: '#eeeeee',
  
  // Dark Colors
  darkGray: '#404040',     // Dark gray for sidebars
  darkGrayBorder: '#2a2a2a', // Darker gray for borders
  
  // Semantic Colors
  primary: '#118ab2',      // Blue - main brand color
  secondary: '#ef476f',    // Red/Pink - accents and CTAs
  success: '#06d6a0',      // Green - success states
  warning: '#ffd166',      // Yellow - warnings
  background: '#eeeeee',   // Light gray - backgrounds
  
  // Color Variations (for hover states, etc.)
  redDark: '#d63d5f',
  blueDark: '#0f7a9a',
  greenDark: '#05b88a',
  yellowDark: '#e6bc4d',
} as const

/**
 * Color palette array for easy iteration
 */
export const colorPalette = [
  colors.blue,
  colors.red,
  colors.green,
  colors.yellow,
] as const

/**
 * Get a color from the palette by index (useful for cycling through colors)
 */
export function getColorByIndex(index: number): string {
  return colorPalette[index % colorPalette.length]
}

/**
 * Color utilities for opacity variations
 */
export const colorUtils = {
  /**
   * Add opacity to a hex color
   */
  withOpacity: (color: string, opacity: number): string => {
    // Remove # if present
    const hex = color.replace('#', '')
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },
  
  /**
   * Get a lighter version of a color (for backgrounds)
   */
  lighten: (color: string, amount: number = 0.2): string => {
    return colorUtils.withOpacity(color, amount)
  },
} as const

