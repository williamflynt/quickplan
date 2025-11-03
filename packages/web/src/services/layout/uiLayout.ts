import { UiLayout, LayoutStyles } from '../../types/layout'

const BREAKPOINT_NARROW = 768
const BREAKPOINT_VERTICAL = 576

export function calculateUiLayout(width: number): UiLayout {
  if (width < BREAKPOINT_VERTICAL) return 'vertical'
  if (width < BREAKPOINT_NARROW) return 'narrow'
  return 'wide'
}

export function getUiLayoutStyles(mode: UiLayout): LayoutStyles {
  switch (mode) {
    case 'vertical':
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 35,
        minLeftWidth: 20,
        maxLeftWidth: 60,
      }
    case 'narrow':
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 40,
        minLeftWidth: 25,
        maxLeftWidth: 60,
      }
    case 'wide':
    default:
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 50,
        minLeftWidth: 30,
        maxLeftWidth: 70,
      }
  }
}
