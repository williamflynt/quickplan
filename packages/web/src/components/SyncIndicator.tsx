import React, { FC, useEffect, useState } from 'react'
import { SaveOutlined, CloudSyncOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Tooltip, Typography } from 'antd'

export type SyncStatus = 'saved' | 'unsaved' | 'synced' | 'syncing'

interface SyncIndicatorProps {
  status: SyncStatus
  lastSyncTime?: number
  onClick?: () => void
}

export const SyncIndicator: FC<SyncIndicatorProps> = ({
  status,
  lastSyncTime,
  onClick,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!lastSyncTime) {
      setTimeAgo('')
      return
    }

    const updateTimeAgo = () => {
      const now = Date.now()
      const diff = now - lastSyncTime
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
    const interval = setInterval(updateTimeAgo, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [lastSyncTime])

  const getIcon = () => {
    switch (status) {
      case 'saved':
        return <SaveOutlined style={{ color: '#52c41a' }} />
      case 'unsaved':
        return <SaveOutlined style={{ color: '#faad14' }} />
      case 'synced':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'syncing':
        return <CloudSyncOutlined spin style={{ color: '#1890ff' }} />
    }
  }

  const getText = () => {
    switch (status) {
      case 'saved':
        return 'Auto-saved'
      case 'unsaved':
        return 'Unsaved changes'
      case 'synced':
        return lastSyncTime ? `Synced ${timeAgo}` : 'Synced'
      case 'syncing':
        return 'Syncing...'
    }
  }

  const getTooltip = () => {
    switch (status) {
      case 'saved':
        return 'Project auto-saved to browser storage'
      case 'unsaved':
        return 'You have unsaved changes. Press Ctrl+S (Cmd+S) to save to disk.'
      case 'synced':
        return lastSyncTime
          ? `Last saved to disk: ${new Date(lastSyncTime).toLocaleString()}`
          : 'Saved to disk'
      case 'syncing':
        return 'Saving to disk...'
    }
  }

  return (
    <Tooltip title={getTooltip()}>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '2px 12px',
          cursor: onClick ? 'pointer' : 'default',
          background: '#2d2d2d',
          borderRadius: '4px',
          transition: 'all 0.2s',
          border: '1px solid #454545',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.background = '#3e3e3e'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#2d2d2d'
        }}
      >
        {getIcon()}
        <Typography.Text style={{ fontSize: '0.85em', color: '#d4d4d4' }}>
          {getText()}
        </Typography.Text>
      </div>
    </Tooltip>
  )
}
