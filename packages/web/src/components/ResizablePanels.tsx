import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

interface ResizablePanelsProps {
  leftPane: ReactNode
  rightPane: ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  direction?: 'horizontal' | 'vertical'
}

export const ResizablePanels: FC<ResizablePanelsProps> = ({
  leftPane,
  rightPane,
  defaultLeftWidth = 25,
  minLeftWidth = 15,
  maxLeftWidth = 60,
  direction = 'horizontal',
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()

      let newWidth: number
      if (direction === 'horizontal') {
        const offsetX = e.clientX - containerRect.left
        newWidth = (offsetX / containerRect.width) * 100
      } else {
        const offsetY = e.clientY - containerRect.top
        newWidth = (offsetY / containerRect.height) * 100
      }

      // Clamp the width to min/max bounds
      newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth))
      setLeftWidth(newWidth)
    },
    [isDragging, direction, minLeftWidth, maxLeftWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'
      document.body.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize'
      // Prevent pointer events on iframe to ensure smooth dragging
      document.body.style.pointerEvents = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.body.style.pointerEvents = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.body.style.pointerEvents = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction])

  const isHorizontal = direction === 'horizontal'
  const rightWidth = 100 - leftWidth

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${leftWidth}%`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {leftPane}
        {isDragging && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              cursor: isHorizontal ? 'ew-resize' : 'ns-resize',
            }}
          />
        )}
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          [isHorizontal ? 'width' : 'height']: '4px',
          backgroundColor: isDragging ? '#1890ff' : '#ddd',
          cursor: isHorizontal ? 'ew-resize' : 'ns-resize',
          flexShrink: 0,
          position: 'relative',
          transition: isDragging ? 'none' : 'background-color 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = '#999'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = '#ddd'
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            [isHorizontal ? 'top' : 'left']: '50%',
            [isHorizontal ? 'left' : 'top']: '50%',
            transform: 'translate(-50%, -50%)',
            width: isHorizontal ? '4px' : '20px',
            height: isHorizontal ? '20px' : '4px',
            backgroundColor: 'inherit',
            borderRadius: '2px',
          }}
        />
      </div>

      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${rightWidth}%`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {rightPane}
        {isDragging && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              cursor: isHorizontal ? 'ew-resize' : 'ns-resize',
            }}
          />
        )}
      </div>
    </div>
  )
}
