import { FC, useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { Tooltip, Typography } from 'antd'
import { ScheduleRow } from '../../services/resource/scheduleBuilder'
import { formatDateRange } from '../../utils/dateFormat'
import type {
  CalendarConfig,
  DateAxisEntry,
  ResourceScheduleRow,
} from '@quickplan/scheduler'
import type { ResourceInfo } from '../../types/graph'
import './ResourceGantt.css'

type Props = {
  rows: ScheduleRow[]
  maxTime: number
  onTaskClick: (taskId: string) => void
  onTaskHover: (taskId: string | null) => void
  onResourceClick: (resourceName: string) => void
  activeResourceFilter: string | null
  calendarConfig: CalendarConfig | null
  dateAxis: DateAxisEntry[] | null
  scheduledRows: ResourceScheduleRow[] | null
  calendarMaxTime: number
  resourceInfoMap: Map<string, ResourceInfo>
  scrollableY: boolean
}

const MIN_CHART_WIDTH = 400
const DAY_WIDTH = 20
const ROW_HEIGHT = 32

function utilizationColor(pct: number): string {
  if (pct > 100) return '#e15759'
  if (pct >= 80) return '#edc948'
  return '#59a14f'
}

export const ResourceGantt: FC<Props> = ({
  rows,
  maxTime,
  onTaskClick,
  onTaskHover,
  onResourceClick,
  activeResourceFilter,
  calendarConfig,
  dateAxis,
  scheduledRows,
  calendarMaxTime,
  resourceInfoMap,
  scrollableY,
}) => {
  const hasCalendar = !!(calendarConfig && dateAxis && scheduledRows)

  const dateIndexMap = useMemo(() => {
    if (!dateAxis) return new Map<string, number>()
    const map = new Map<string, number>()
    dateAxis.forEach((entry, i) => map.set(entry.date, i))
    return map
  }, [dateAxis])

  const [containerWidth, setContainerWidth] = useState(0)

  const effectiveRows = hasCalendar ? scheduledRows!.length : rows.length

  const labelRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dataWidth = hasCalendar ? calendarMaxTime * DAY_WIDTH : maxTime * 30
  const chartWidth = Math.max(containerWidth, dataWidth, MIN_CHART_WIDTH)
  const scale = hasCalendar ? DAY_WIDTH : maxTime > 0 ? chartWidth / maxTime : 1

  const onChartScroll = useCallback(() => {
    if (chartRef.current && labelRef.current) {
      labelRef.current.scrollTop = chartRef.current.scrollTop
    }
  }, [])

  return (
    <div className="gantt">
      <div ref={labelRef} className="gantt-labels">
        {hasCalendar && <div className="gantt-label-header-spacer" />}
        {hasCalendar
          ? scheduledRows!.map((row) => (
              <ResourceLabel
                key={row.resourceName}
                row={row}
                info={resourceInfoMap.get(row.resourceName)}
                onClick={() => onResourceClick(row.resourceName)}
                active={activeResourceFilter === row.resourceName}
              />
            ))
          : rows.map((row) => (
              <ResourceLabelFull
                key={row.resource.name}
                row={row}
                onClick={() => onResourceClick(row.resource.name)}
                active={activeResourceFilter === row.resource.name}
              />
            ))}
      </div>

      <div
        ref={chartRef}
        onScroll={onChartScroll}
        className={`gantt-chart${scrollableY ? ' gantt-chart--scroll-y' : ''}`}
      >
        <div
          className={`gantt-chart-inner${hasCalendar ? ' gantt-chart-inner--cal' : ''}`}
          style={{ width: chartWidth, minHeight: effectiveRows * ROW_HEIGHT }}
        >
          {hasCalendar ? (
            <CalendarAxis dateAxis={dateAxis!} scale={scale} />
          ) : (
            <OffsetAxis maxTime={maxTime} scale={scale} />
          )}

          {hasCalendar
            ? scheduledRows!.map((row) => (
                <CalendarRow
                  key={row.resourceName}
                  row={row}
                  dateIndexMap={dateIndexMap}
                  scale={scale}
                  onTaskClick={onTaskClick}
                  onTaskHover={onTaskHover}
                />
              ))
            : rows.map((row) => (
                <OffsetRow
                  key={row.resource.name}
                  row={row}
                  scale={scale}
                  onTaskClick={onTaskClick}
                  onTaskHover={onTaskHover}
                />
              ))}
        </div>
      </div>
    </div>
  )
}

const ResourceLabel: FC<{
  row: ResourceScheduleRow
  info?: ResourceInfo
  onClick: () => void
  active: boolean
}> = ({ row, info, onClick, active }) => {
  const doneCount = row.tasks.filter((t) => t.done).length
  const tooltipLines = [
    info?.role && `Role: ${info.role}`,
    `Tasks: ${row.tasks.length} (${doneCount} done)`,
    `Working days: ${Math.round(row.totalWorkingDays * 10) / 10}`,
    row.calendarSpan > 0 && `Calendar span: ${row.calendarSpan}d`,
  ].filter(Boolean)

  return (
    <Tooltip
      title={tooltipLines.join('\n')}
      overlayStyle={{ whiteSpace: 'pre-line' }}
    >
      <div
        className={`gantt-label-row${active ? ' gantt-label-row--active' : ''}`}
        onClick={onClick}
      >
        {info?.color && (
          <span
            className="gantt-label-color"
            style={{ backgroundColor: info.color }}
          />
        )}
        <div className="gantt-label-info">
          <Typography.Text className="gantt-label-name" ellipsis>
            {row.resourceName}
          </Typography.Text>
          {info?.role && (
            <Typography.Text className="gantt-label-role" ellipsis>
              {info.role}
            </Typography.Text>
          )}
        </div>
      </div>
    </Tooltip>
  )
}

const ResourceLabelFull: FC<{
  row: ScheduleRow
  onClick: () => void
  active: boolean
}> = ({ row, onClick, active }) => (
  <div
    className={`gantt-label-row${active ? ' gantt-label-row--active' : ''}`}
    onClick={onClick}
  >
    <span
      className="gantt-label-color"
      style={{ backgroundColor: row.resource.color }}
    />
    <div className="gantt-label-info">
      <Typography.Text className="gantt-label-name" ellipsis>
        {row.resource.name}
      </Typography.Text>
      {row.resource.role && (
        <Typography.Text className="gantt-label-role" ellipsis>
          {row.resource.role}
        </Typography.Text>
      )}
    </div>
    <Tooltip
      title={`${Math.round(row.totalDuration * 10) / 10}/${row.resource.maxHours}h`}
    >
      <span
        className="gantt-utilization"
        style={{ backgroundColor: utilizationColor(row.utilizationPct) }}
      >
        {row.utilizationPct}%
      </span>
    </Tooltip>
  </div>
)

const dayTypeClass: Record<DateAxisEntry['type'], string> = {
  working: 'gantt-cal-day',
  weekend: 'gantt-cal-day gantt-cal-day--weekend',
  holiday: 'gantt-cal-day gantt-cal-day--holiday',
}

const labelTypeClass: Record<DateAxisEntry['type'], string> = {
  working: 'gantt-cal-label',
  weekend: 'gantt-cal-label gantt-cal-label--nonworking',
  holiday:
    'gantt-cal-label gantt-cal-label--nonworking gantt-cal-label--holiday',
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

type MonthGroup = { label: string; startIdx: number; count: number }

function buildMonthGroups(dateAxis: DateAxisEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  let prev = ''
  for (let i = 0; i < dateAxis.length; i++) {
    const [y, m] = dateAxis[i].date.split('-')
    const key = `${y}-${m}`
    if (key !== prev) {
      groups.push({
        label: `${MONTH_NAMES[Number(m) - 1]} ${y}`,
        startIdx: i,
        count: 1,
      })
      prev = key
    } else {
      groups[groups.length - 1].count++
    }
  }
  return groups
}

function todayIndex(dateAxis: DateAxisEntry[]): number {
  const today = new Date().toISOString().slice(0, 10)
  return dateAxis.findIndex((e) => e.date === today)
}

const CalendarAxis: FC<{ dateAxis: DateAxisEntry[]; scale: number }> = ({
  dateAxis,
  scale,
}) => {
  const months = useMemo(() => buildMonthGroups(dateAxis), [dateAxis])
  const todayIdx = useMemo(() => todayIndex(dateAxis), [dateAxis])
  // Skip day labels when columns are too narrow to fit a 2-digit number
  const showEvery = scale < 14 ? Math.ceil(14 / scale) : 1

  return (
    <>
      {/* Month group headers */}
      {months.map((g) => (
        <div
          key={g.label}
          className="gantt-month-header"
          style={{
            left: g.startIdx * scale,
            width: g.count * scale,
          }}
        >
          {g.label}
        </div>
      ))}

      {/* Day columns + labels */}
      {dateAxis.map((entry, i) => {
        const day = Number(entry.date.split('-')[2])
        return (
          <div
            key={entry.date}
            className={dayTypeClass[entry.type]}
            style={{ left: i * scale, width: scale }}
          >
            {(i % showEvery === 0 || day === 1) && (
              <span className={labelTypeClass[entry.type]}>{day}</span>
            )}
          </div>
        )
      })}

      {/* Today marker */}
      {todayIdx >= 0 && (
        <div
          className="gantt-today-marker"
          style={{ left: (todayIdx + 0.5) * scale }}
        />
      )}
    </>
  )
}

const OffsetAxis: FC<{ maxTime: number; scale: number }> = ({
  maxTime,
  scale,
}) => {
  const days: number[] = []
  for (let d = 0; d <= Math.ceil(maxTime); d++) days.push(d)

  return (
    <>
      {days.map((d) => (
        <div
          key={d}
          className="gantt-offset-marker"
          style={{ left: d * scale }}
        >
          <span className="gantt-axis-label">{d}</span>
        </div>
      ))}
    </>
  )
}

const CalendarRow: FC<{
  row: ResourceScheduleRow
  dateIndexMap: Map<string, number>
  scale: number
  onTaskClick: (taskId: string) => void
  onTaskHover: (taskId: string | null) => void
}> = ({ row, dateIndexMap, scale, onTaskClick, onTaskHover }) => (
  <div className="gantt-task-row">
    {row.tasks.map((task) => {
      const startIdx = dateIndexMap.get(task.startDate) ?? 0
      const finishIdx = dateIndexMap.get(task.finishDate) ?? startIdx
      return (
        <Tooltip
          key={task.taskId}
          trigger={['hover', 'click']}
          title={`${task.taskName} (${formatDateRange(task.startDate, task.finishDate)})`}
        >
          <div
            onClick={() => onTaskClick(task.taskId)}
            onMouseEnter={() => onTaskHover(task.taskId)}
            onMouseLeave={() => onTaskHover(null)}
            className={`gantt-task-bar gantt-task-bar--cal${task.isCritical ? ' gantt-task-bar--critical' : ''}${task.done ? ' gantt-task-bar--done' : ''}`}
            style={{
              left: startIdx * scale,
              width: Math.max((finishIdx - startIdx + 1) * scale - 1, 4),
            }}
          >
            <span
              className={`gantt-task-label${task.done ? ' gantt-task-label--done' : ''}`}
            >
              {task.done ? '\u2713 ' : ''}
              {task.taskName}
            </span>
          </div>
        </Tooltip>
      )
    })}
  </div>
)

const OffsetRow: FC<{
  row: ScheduleRow
  scale: number
  onTaskClick: (taskId: string) => void
  onTaskHover: (taskId: string | null) => void
}> = ({ row, scale, onTaskClick, onTaskHover }) => (
  <div className="gantt-task-row">
    {row.tasks.map((task) => (
      <Tooltip
        key={task.taskId}
        trigger={['hover', 'click']}
        title={`${task.taskName} (${Math.round(task.start * 10) / 10}\u2013${Math.round(task.finish * 10) / 10})`}
      >
        <div
          onClick={() => onTaskClick(task.taskId)}
          onMouseEnter={() => onTaskHover(task.taskId)}
          onMouseLeave={() => onTaskHover(null)}
          className={`gantt-task-bar${task.isCritical ? ' gantt-task-bar--critical' : ''}`}
          style={{
            left: task.start * scale,
            width: Math.max(task.duration * scale, 4),
            backgroundColor: row.resource.color + (task.done ? '55' : 'cc'),
          }}
        >
          <span
            className={`gantt-task-label${task.done ? ' gantt-task-label--done' : ''}`}
          >
            {task.done ? '\u2713 ' : ''}
            {task.taskName}
          </span>
        </div>
      </Tooltip>
    ))}
  </div>
)
