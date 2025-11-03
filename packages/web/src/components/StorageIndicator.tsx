import React, { FC, useEffect, useState } from 'react'
import { SaveOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Tooltip, Typography } from 'antd'

export type StorageStatus = 'saved' | 'unsaved' | 'saving'

interface StorageIndicatorProps {
  type: 'browser' | 'disk'
  status: StorageStatus
  lastSaveTime?: number
}

export const StorageIndicator: FC<StorageIndicatorProps> = ({
  type,
  status,
  lastSaveTime,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!lastSaveTime || status !== 'saved') {
      setTimeAgo('')
      return
    }

    const updateTimeAgo = () => {
      const now = Date.now()
      const diff = now - lastSaveTime
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (seconds < 60) {
        setTimeAgo('just now')
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`)
      } else {
        setTimeAgo(`${hours}h ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000)

    return () => clearInterval(interval)
  }, [lastSaveTime, status])

  const getIcon = () => {
    switch (status) {
      case 'saved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'unsaved':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />
      case 'saving':
        return <SaveOutlined spin style={{ color: '#1890ff' }} />
    }
  }

  const getLabel = () => {
    return type === 'browser' ? 'Browser' : 'Disk'
  }

  const getStatusText = () => {
    switch (status) {
      case 'saved':
        return timeAgo ? timeAgo : 'saved'
      case 'unsaved':
        return 'not saved'
      case 'saving':
        return 'saving...'
    }
  }

  const getTooltip = () => {
    if (type === 'browser') {
      switch (status) {
        case 'saved':
          return `Auto-saved to browser storage ${timeAgo ? timeAgo : ''}`
        case 'unsaved':
          return 'Changes not yet auto-saved (will save in 2 seconds)'
        case 'saving':
          return 'Saving to browser storage...'
      }
    } else {
      switch (status) {
        case 'saved':
          return `Downloaded ${timeAgo ? timeAgo : ''}`
        case 'unsaved':
          return 'Not downloaded. Press Ctrl+S (Cmd+S) to download.'
        case 'saving':
          return 'Downloading...'
      }
    }
  }

  return (
    <Tooltip title={getTooltip()}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: '4px 8px',
          background: '#2d2d2d',
          borderRadius: '4px',
          border: '1px solid #454545',
          minWidth: '70px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {getIcon()}
          <Typography.Text style={{ fontSize: '0.7em', color: '#888' }}>
            {getLabel()}
          </Typography.Text>
        </div>
        <Typography.Text style={{ fontSize: '0.75em', color: '#d4d4d4' }}>
          {getStatusText()}
        </Typography.Text>
      </div>
    </Tooltip>
  )
}
