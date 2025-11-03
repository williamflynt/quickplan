import { CSSProperties } from 'react'

export type UiLayout = 'wide' | 'narrow' | 'vertical'

export type LayoutStyles = {
  container: CSSProperties
  defaultLeftWidth: number
  minLeftWidth: number
  maxLeftWidth: number
}
