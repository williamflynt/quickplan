import React, { FC, memo, useMemo } from 'react'
import { Handle, Position, XYPosition } from '@xyflow/react'
import { useStore } from '../../store/store'
import { Tooltip, Typography } from 'antd'
import { CpmData } from './CpmTaskNode'
import { offsetToDate } from '@quickplan/scheduler'
import { formatDateFull, formatDateShort } from '../../utils/dateFormat'

export type MilestoneNodeData = {
  label: string
  description?: string
  cpm: CpmData
  done?: boolean
  doneDate?: string
}

export type MilestoneNodeShape = {
  id: string
  position: XYPosition
  data: MilestoneNodeData
}

/**
 * Approximate the standard normal CDF using the Abramowitz & Stegun formula.
 */
function normalCdf(x: number): number {
  if (x < -6) return 0
  if (x > 6) return 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.2316419 * a)
  const d = 0.3989422804014327 * Math.exp((-a * a) / 2)
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.3302744))))
  return x > 0 ? 1 - p : p
}

function computeConfidence(slack: number, pathVariance: number): number {
  if (pathVariance <= 0) return 100
  const z = slack / Math.sqrt(pathVariance)
  return Math.round(normalCdf(z) * 100)
}

type MilestoneSummaryCardProps = {
  nodeId: string
  label: string
  description?: string
  cpm: CpmData
  done?: boolean
  doneDate?: string
}

const MilestoneSummaryCard: FC<MilestoneSummaryCardProps> = ({
  nodeId,
  label,
  description,
  cpm,
  done,
  doneDate,
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
  const confidence = computeConfidence(cpm.slack, cpm.pathVariance)

  const rows: [string, React.ReactNode][] = []

  if (calendarConfig) {
    const plannedDate = formatDateFull(
      offsetToDate(cpm.earliestFinish, calendarConfig),
    )
    rows.push(['Planned', plannedDate])
  }

  if (done && doneDate) {
    rows.push(['Actual', formatDateFull(doneDate)])
  }

  rows.push([
    'Confidence',
    <span
      key="conf"
      style={{
        color:
          confidence >= 80
            ? '#52c41a'
            : confidence >= 50
              ? '#faad14'
              : '#ff4d4f',
      }}
    >
      {confidence}%
    </span>,
  ])

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
            <tr key={String(key)}>
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

const MilestoneNode: FC<MilestoneNodeShape> = (props) => {
  const { id, data } = props
  const { label, description, cpm, done, doneDate } = data
  const { activeNodeId, activeResourceFilter, calendarConfig } = useStore()

  const isActive = activeNodeId === id

  const toggleNodeActive = () => {
    useStore.setState({
      activeNodeId: isActive ? null : id,
      nodeToolsVisible: !isActive,
    })
  }

  const baseClassName = isActive ? 'milestone-node-active' : 'milestone-node'
  const className =
    baseClassName +
    (activeResourceFilter != null ? ' milestone-node-filtered-out' : '')
  const confidence = cpm ? computeConfidence(cpm.slack, cpm.pathVariance) : null
  const expectedCompletion = cpm?.earliestFinish

  const plannedDate =
    calendarConfig && expectedCompletion != null
      ? formatDateShort(offsetToDate(expectedCompletion, calendarConfig))
      : null

  return (
    <div className={className} onClick={toggleNodeActive}>
      <Handle type="target" position={Position.Left} isConnectable />

      <Tooltip
        title={
          <MilestoneSummaryCard
            nodeId={id}
            label={label}
            description={description}
            cpm={cpm}
            done={done}
            doneDate={doneDate}
          />
        }
        placement="top"
        mouseEnterDelay={0.4}
      >
        <div className="milestone-content">
          {plannedDate ? (
            <Typography.Text type="secondary" style={{ fontSize: '0.65em' }}>
              {plannedDate}
            </Typography.Text>
          ) : (
            expectedCompletion != null && (
              <Typography.Text type="secondary" style={{ fontSize: '0.65em' }}>
                Day {expectedCompletion}
              </Typography.Text>
            )
          )}

          <Typography.Text strong style={{ fontSize: '0.75em' }}>
            {label}
          </Typography.Text>

          {done && doneDate ? (
            <Typography.Text style={{ fontSize: '0.65em', color: '#52c41a' }}>
              {formatDateShort(doneDate)}
            </Typography.Text>
          ) : (
            confidence != null && (
              <Typography.Text
                style={{
                  fontSize: '0.65em',
                  color:
                    confidence >= 80
                      ? '#52c41a'
                      : confidence >= 50
                        ? '#faad14'
                        : '#ff4d4f',
                }}
              >
                {confidence}% conf.
              </Typography.Text>
            )
          )}
        </div>
      </Tooltip>

      <Handle type="source" position={Position.Right} isConnectable />
    </div>
  )
}

MilestoneNode.displayName = 'MilestoneNode'

export default memo(MilestoneNode)
