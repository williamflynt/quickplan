import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlOrCmd?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

/**
 * Custom hook for keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrCmdPressed = e.ctrlKey || e.metaKey
        const shiftPressed = e.shiftKey
        const altPressed = e.altKey
        
        // Check if key matches
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()

        // Check modifiers match exactly what's required
        const requiredCtrl = shortcut.ctrlOrCmd || false
        const requiredShift = shortcut.shift || false
        const requiredAlt = shortcut.alt || false
        
        if (
          keyMatches &&
          requiredCtrl === ctrlOrCmdPressed &&
          requiredShift === shiftPressed &&
          requiredAlt === altPressed
        ) {
          e.preventDefault()
          shortcut.handler(e)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}
