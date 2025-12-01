export const colors = {
  red: '#ef476f',
  yellow: '#ffd166',
  green: '#06d6a0',
  blue: '#118ab2',
  gray: '#eeeeee',
  darkGray: '#404040',
  darkGrayBorder: '#2a2a2a',
  primary: '#118ab2',
  secondary: '#ef476f',
  success: '#06d6a0',
  warning: '#ffd166',
  background: '#eeeeee',
  redDark: '#d63d5f',
  blueDark: '#0f7a9a',
  greenDark: '#05b88a',
  yellowDark: '#e6bc4d',
} as const

export const colorPalette = [
  colors.blue,
  colors.red,
  colors.green,
  colors.yellow,
] as const

export function getColorByIndex(index: number): string {
  return colorPalette[index % colorPalette.length]
}

export const colorUtils = {
  withOpacity: (color: string, opacity: number): string => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },
  
  lighten: (color: string, amount: number = 0.2): string => {
    return colorUtils.withOpacity(color, amount)
  },
} as const

