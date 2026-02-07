import React, { FC } from 'react'
import { Typography } from 'antd'
import { MinusOutlined } from '@ant-design/icons'
import { ScheduleRow } from '../../services/resource/scheduleBuilder'
import { ResourceGantt } from './ResourceGantt'
import type {
  CalendarConfig,
  DateAxisEntry,
  ResourceScheduleRow,
} from '@quickplan/scheduler'
import type { ResourceInfo } from '../../types/graph'

const ROW_HEIGHT = 32
const HEADER_HEIGHT = 28
const MAX_PANEL_HEIGHT = 400

type Props = {
  open: boolean
  scheduleRows: ScheduleRow[]
  maxTime: number
  onTaskClick: (taskId: string) => void
  onTaskHover: (taskId: string | null) => void
  onResourceClick: (resourceName: string) => void
  activeResourceFilter: string | null
  onClose: () => void
  calendarConfig: CalendarConfig | null
  dateAxis: DateAxisEntry[] | null
  scheduledRows: ResourceScheduleRow[] | null
  calendarMaxTime: number
  resourceInfoMap: Map<string, ResourceInfo>
}

export const ResourcePanel: FC<Props> = ({
  open,
  scheduleRows,
  maxTime,
  onTaskClick,
  onTaskHover,
  onResourceClick,
  activeResourceFilter,
  onClose,
  calendarConfig,
  dateAxis,
  scheduledRows,
  calendarMaxTime,
  resourceInfoMap,
}) => {
  const hasCalendar = calendarConfig && dateAxis && scheduledRows
  const effectiveRowCount = hasCalendar
    ? scheduledRows.length
    : scheduleRows.length

  // Auto-size to fit all rows, capped at max.
  // Extra 30px accounts for horizontal scrollbar + border overhead in the chart area.
  // Calendar mode adds 30px for month/day header rows.
  const headerExtra = hasCalendar ? 30 : 0
  const contentHeight = effectiveRowCount * ROW_HEIGHT + 30 + headerExtra
  const naturalHeight = HEADER_HEIGHT + contentHeight
  const isCapped = naturalHeight > MAX_PANEL_HEIGHT
  const panelHeight = open ? Math.min(naturalHeight, MAX_PANEL_HEIGHT) : 0

  return (
    <div
      style={{
        height: panelHeight,
        overflow: 'hidden',
        background: '#1e1e1e',
        borderTop: open ? '1px solid #333' : 'none',
        transition: 'height 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '4px 12px',
          borderBottom: '1px solid #333',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: HEADER_HEIGHT,
        }}
      >
        <MinusOutlined
          onClick={onClose}
          style={{
            color: '#858585',
            fontSize: 12,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        />
        <Typography.Text
          style={{ color: '#d4d4d4', fontSize: 12, fontWeight: 600 }}
        >
          Resource Schedule
        </Typography.Text>
        {hasCalendar && (
          <Typography.Text style={{ color: '#858585', fontSize: 10 }}>
            (from {calendarConfig.startDate})
          </Typography.Text>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {effectiveRowCount > 0 ? (
          <ResourceGantt
            rows={scheduleRows}
            maxTime={maxTime}
            onTaskClick={onTaskClick}
            onTaskHover={onTaskHover}
            onResourceClick={onResourceClick}
            activeResourceFilter={activeResourceFilter}
            calendarConfig={calendarConfig}
            dateAxis={dateAxis}
            scheduledRows={scheduledRows}
            calendarMaxTime={calendarMaxTime}
            resourceInfoMap={resourceInfoMap}
            scrollableY={isCapped}
          />
        ) : (
          <div style={{ padding: 12, color: '#858585', fontSize: 12 }}>
            No resource assignments. Use{' '}
            <code style={{ color: '#ce9178' }}>
              $ResourceName &gt; TaskName
            </code>{' '}
            syntax to assign resources.
          </div>
        )}
      </div>
    </div>
  )
}
