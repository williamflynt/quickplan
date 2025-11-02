import React, { FC, memo } from 'react'
import { Handle, Position, XYPosition } from '@xyflow/react'
import { Col, Row, Tooltip, Typography } from 'antd'
import { useStore } from '../../store/store'

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
}

export type CpmNodeData = {
  label: string
  description?: string
  cpm: CpmData
}

export type CpmNodeShape = {
  id: string
  position: XYPosition
  data: CpmNodeData
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
const CpmDataRow: FC<CpmDataRowProps> = ({
  type,
  left,
  center,
  right,
  isMilestone,
}) => {
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

  if (isMilestone) {
    // For a milestone, don't worry about slack or duration.
    return <DataRow border={border} components={[leftElem, rightElem]} />
  }
  return (
    <DataRow border={border} components={[leftElem, centerElem, rightElem]} />
  )
}

/**
 * NodeTextComponent is the center, bolded display label of the Node in React Flow.
 */
const NodeTextComponent: FC<{ data: CpmNodeShape; isMilestone?: boolean }> = ({
  data,
  isMilestone,
}) => {
  const labelComponent = (
    <Typography.Text strong style={{ fontSize: '0.8em' }}>
      {data.data.label || data.id}
    </Typography.Text>
  )
  return (
    <Tooltip
      title={`${data.id}: ${data.data.description || 'No description.'}`}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {labelComponent}
      </div>
    </Tooltip>
  )
}

const CpmTaskNode: FC<CpmNodeShape> = (props) => {
  const { activeNodeId } = useStore()

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

  const className = activeNodeId === props.id ? 'cpm-node-active' : 'cpm-node'

  const isMilestone = props.data.cpm.duration === 0
  
  // Add red glow for zero-duration tasks
  const nodeStyle = isMilestone ? {
    boxShadow: '0 0 8px 2px rgba(255, 85, 85, 0.5)',
  } : {}
  
  const milestoneBanner = (
    <Typography.Text
      style={{
        fontSize: '0.7em',
        padding: '3px',
        border: '1px solid #bbb',
        borderRadius: '3px',
      }}
    >
      Milestone
    </Typography.Text>
  )

  const tinyIdTag = (
    <Typography.Text
      style={{ fontSize: '0.4em', position: 'absolute', top: 30, left: 5 }}
      code
    >
      {props.id}
    </Typography.Text>
  )

  return (
    <div>
      {tinyIdTag}
      <div className={className} onClick={toggleNodeActive} style={nodeStyle}>
        <Handle type="target" position={Position.Left} isConnectable />
        <CpmDataRow
          type="earlyNums"
          left={topRowComponents[0]}
          center={topRowComponents[1]}
          right={topRowComponents[2]}
          isMilestone={isMilestone}
        />

        <Row justify="space-around">
          <Col>
            <NodeTextComponent isMilestone={isMilestone} data={props} />
          </Col>
        </Row>

        <CpmDataRow
          type="lateNums"
          left={bottomRowComponents[0]}
          center={bottomRowComponents[1]}
          right={bottomRowComponents[2]}
          isMilestone={isMilestone}
        />
        <Handle type="source" position={Position.Right} isConnectable />
      </div>
      {isMilestone && milestoneBanner}
    </div>
  )
}

CpmTaskNode.displayName = 'CpmTaskNode'

export default memo(CpmTaskNode)
