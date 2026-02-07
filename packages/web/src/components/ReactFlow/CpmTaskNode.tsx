import React, { FC, memo, useMemo } from 'react'
import { Handle, Position, XYPosition } from '@xyflow/react'
import { Col, Row, Tooltip, Typography } from 'antd'
import { useStore } from '../../store/store'
import {
  SerializedAssignmentIndex,
  SerializedCluster,
  TaskAssignment,
} from '../../types/graph'
import { ResourcePills } from './ResourcePills'
import { offsetToDate } from '@quickplan/scheduler'
import { formatDateFull } from '../../utils/dateFormat'

export type CpmData = {
  duration: number
  durationLow: number
  durationLikely: number
  durationHigh: number
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  pathVariance: number
  isCritical?: boolean
}

export type CpmNodeData = {
  label: string
  description?: string
  cpm: CpmData
  assignments?: TaskAssignment[]
  done?: boolean
}

export type CpmNodeShape = {
  id: string
  position: XYPosition
  data: CpmNodeData
  clusters?: SerializedCluster[]
  assignments?: SerializedAssignmentIndex
}

type DataRowProps = {
  border: 'top' | 'bottom' | 'both' | 'none'
  components: React.ReactNode[]
}

const DataRow: FC<DataRowProps> = ({ border, components }) => {
  const styles: Record<string, string> = { background: '#fff' }
  const borderString = '1px solid #bbb'
  if (border === 'top' || border === 'both') {
    styles.borderTop = borderString
  }
  if (border === 'bottom' || border === 'both') {
    styles.borderBottom = borderString
  }

  return (
    <Row style={styles} justify="space-around">
      {components.map((c, i) => {
        const key = c ? `${i}-${c.toString()}` : `${i}-falsy`
        return <Col key={key}>{c || 0}</Col>
      })}
    </Row>
  )
}

type CpmDataElementTitleProps = {
  title: string
  pos: 'top' | 'bottom'
  leftOffset: number
}

const CpmDataElementTitle: FC<CpmDataElementTitleProps> = ({
  title,
  pos,
  leftOffset,
}) => {
  return (
    <Typography.Text
      type="secondary"
      style={{
        fontSize: '0.5em',
        position: 'absolute',
        whiteSpace: 'nowrap',
        [pos]: -5,
        left: leftOffset,
      }}
    >
      {title}
    </Typography.Text>
  )
}

type CpmDataElementProps = {
  title: string
  titlePos: 'top' | 'bottom'
  value?: string | number
  color?: string
}

const CpmDataElement: FC<CpmDataElementProps> = (props) => {
  const value = props.value === undefined ? '' : props.value
  // Empirically determined "okay" offsets.
  const baseOffset = -props.title.length + 5
  const leftOffset = value.toString().length >= 2 ? baseOffset : baseOffset - 6

  const titleElem = (
    <CpmDataElementTitle
      title={props.title}
      pos={props.titlePos}
      leftOffset={leftOffset}
    />
  )
  return (
    <Typography.Text style={{ color: props.color }}>
      {titleElem}
      {props.value}
    </Typography.Text>
  )
}

type CpmDataRowProps = {
  type: 'earlyNums' | 'lateNums'
  left: string | number
  center: string | number
  right: string | number
  isMilestone?: boolean
}

/**
 * CpmDataRow is a row on the top or bottom of the CpmTaskNode with early/late
 * start and finish, plus slack or duration.
 */
const CpmDataRow: FC<CpmDataRowProps> = ({ type, left, center, right }) => {
  const border = type === 'earlyNums' ? 'bottom' : 'top'
  const titlePos = type === 'earlyNums' ? 'top' : 'bottom'
  // Color early times green, and latest times red.
  const edgeTextColor = type === 'earlyNums' ? '#118811' : '#cc5511'
  // Color positive slack blue.
  const centerTextColor = type === 'earlyNums' ? undefined : '#0077dd'

  const leftTitle = type === 'earlyNums' ? 'Earliest Start' : 'Latest Start'
  const centerTitle = type === 'earlyNums' ? 'Duration' : 'Slack'
  const rightTitle = type === 'earlyNums' ? 'Earliest Finish' : 'Latest Finish'

  const leftElem = (
    <CpmDataElement
      title={leftTitle}
      titlePos={titlePos}
      value={left}
      color={edgeTextColor}
    />
  )
  const centerElem = (
    <CpmDataElement
      title={centerTitle}
      titlePos={titlePos}
      value={center}
      color={centerTextColor}
    />
  )
  const rightElem = (
    <CpmDataElement
      title={rightTitle}
      titlePos={titlePos}
      value={right}
      color={edgeTextColor}
    />
  )

  return (
    <DataRow border={border} components={[leftElem, centerElem, rightElem]} />
  )
}

type TaskSummaryCardProps = {
  nodeId: string
  label: string
  description?: string
  cpm: CpmData
  assignments?: TaskAssignment[]
}

/**
 * TaskSummaryCard displays a formatted tooltip with task information and dependencies.
 */
const TaskSummaryCard: FC<TaskSummaryCardProps> = ({
  nodeId,
  label,
  description,
  cpm,
  assignments,
}) => {
  const { edges, nodes, calendarConfig } = useStore()

  const { incomingDeps, outgoingDeps } = useMemo(() => {
    const incoming = edges
      .filter((e) => e.target === nodeId)
      .map((e) => nodes.find((n) => n.id === e.source)?.data?.label || e.source)
      .filter(Boolean)
    const outgoing = edges
      .filter((e) => e.source === nodeId)
      .map((e) => nodes.find((n) => n.id === e.target)?.data?.label || e.target)
      .filter(Boolean)
    return { incomingDeps: incoming, outgoingDeps: outgoing }
  }, [nodeId, edges, nodes])

  const isOnCriticalPath = cpm.isCritical === true
  const durationRangeStr =
    cpm.durationLow !== cpm.duration || cpm.durationHigh !== cpm.duration
      ? `${cpm.durationLow}–${cpm.durationLikely}–${cpm.durationHigh}`
      : `${cpm.duration}`

  const rows: [string, string][] = [
    [
      'Duration',
      durationRangeStr +
        (cpm.pathVariance > 0 ? ` (var ${cpm.pathVariance.toFixed(2)})` : ''),
    ],
    ['Slack', String(cpm.slack)],
  ]

  // Show calendar dates when config is present
  if (calendarConfig) {
    const startDate = formatDateFull(
      offsetToDate(cpm.earliestStart, calendarConfig),
    )
    const finishDate = formatDateFull(
      offsetToDate(cpm.earliestFinish, calendarConfig),
    )
    rows.push(['Start', startDate], ['Finish', finishDate])
  }

  if (assignments && assignments.length > 0) {
    rows.push(['Resources', assignments.map((a) => a.resourceName).join(', ')])
  }
  if (incomingDeps.length > 0) {
    rows.push(['Depends on', incomingDeps.join(', ')])
  }
  if (outgoingDeps.length > 0) {
    rows.push(['Unlocks', outgoingDeps.join(', ')])
  }

  return (
    <div style={{ maxWidth: 320 }}>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {label || nodeId}
        {isOnCriticalPath && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(255,80,60,0.85)',
              color: '#fff',
              lineHeight: '14px',
            }}
          >
            critical
          </span>
        )}
      </div>
      {description && (
        <div style={{ opacity: 0.75, marginBottom: 4 }}>{description}</div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: 4,
        }}
      >
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key}>
              <td
                style={{
                  opacity: 0.6,
                  paddingRight: 12,
                  whiteSpace: 'nowrap',
                  paddingTop: 2,
                  paddingBottom: 2,
                  verticalAlign: 'top',
                }}
              >
                {key}
              </td>
              <td style={{ paddingTop: 2, paddingBottom: 2 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CpmTaskNode: FC<CpmNodeShape> = (props) => {
  const { activeNodeId, hoveredNodeId, activeResourceFilter } = useStore()

  const toggleNodeActive = () => {
    if (activeNodeId === props.id) {
      useStore.setState({ activeNodeId: null })
      return
    }
    useStore.setState({ activeNodeId: props.id, nodeToolsVisible: true })
  }

  const bottomRowComponents = [
    props.data.cpm.latestStart,
    props.data.cpm.slack,
    props.data.cpm.latestFinish,
  ]
  const topRowComponents = [
    props.data.cpm.earliestStart,
    props.data.cpm.duration,
    props.data.cpm.earliestFinish,
  ]

  const isDone = props.data.done === true
  const isFilteredOut =
    activeResourceFilter != null &&
    !props.data.assignments?.some(
      (a) => a.resourceName === activeResourceFilter,
    )
  const isHovered = hoveredNodeId === props.id
  const baseClass = activeNodeId === props.id ? 'cpm-node-active' : 'cpm-node'
  const className =
    (isDone ? `${baseClass} cpm-node-done` : baseClass) +
    (isFilteredOut ? ' cpm-node-filtered-out' : '') +
    (isHovered ? ' cpm-node-hovered' : '')

  // Add red glow for zero-duration tasks
  const nodeStyle =
    props.data.cpm.duration === 0 && !isDone
      ? {
          boxShadow: '0 0 8px 2px rgba(255, 85, 85, 0.5)',
        }
      : {}

  const tinyIdTag = (
    <Typography.Text
      style={{ fontSize: '0.4em', position: 'absolute', top: 30, left: 5 }}
      code
    >
      {props.id}
    </Typography.Text>
  )

  return (
    <Tooltip
      title={
        <TaskSummaryCard
          nodeId={props.id}
          label={props.data.label}
          description={props.data.description}
          cpm={props.data.cpm}
          assignments={props.data.assignments}
        />
      }
      placement="top"
      mouseEnterDelay={0.4}
    >
      <div style={{ position: 'relative' }}>
        {tinyIdTag}
        <div className={className} onClick={toggleNodeActive} style={nodeStyle}>
          <Handle type="target" position={Position.Left} isConnectable />
          <CpmDataRow
            type="earlyNums"
            left={topRowComponents[0]}
            center={topRowComponents[1]}
            right={topRowComponents[2]}
          />

          <Row justify="space-around">
            <Col>
              <Typography.Text strong style={{ fontSize: '0.8em' }}>
                {props.data.label || props.id}
              </Typography.Text>
            </Col>
          </Row>

          <CpmDataRow
            type="lateNums"
            left={bottomRowComponents[0]}
            center={bottomRowComponents[1]}
            right={bottomRowComponents[2]}
          />
          <Handle type="source" position={Position.Right} isConnectable />
        </div>
        {props.data.assignments && props.data.assignments.length > 0 && (
          <ResourcePills assignments={props.data.assignments} />
        )}
      </div>
    </Tooltip>
  )
}

CpmTaskNode.displayName = 'CpmTaskNode'

export default memo(CpmTaskNode)
