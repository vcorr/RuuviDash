import { createContext, useContext } from 'react'
import type { Theme } from './tokens'

export const ThemeContext = createContext<Theme | null>(null)
export const useTheme = () => {
  const t = useContext(ThemeContext)
  if (!t) throw new Error('useTheme must be used within ThemeContext.Provider')
  return t
}
