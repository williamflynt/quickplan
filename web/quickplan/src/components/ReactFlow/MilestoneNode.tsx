import { FC, memo } from 'react'
import { Handle, Position, XYPosition } from '@xyflow/react'
import { useStore } from '../../store/store'
import { Col, Row, Tooltip, Typography } from 'antd'
import { FlagFilled } from '@ant-design/icons'

export type MilestoneNodeData = {
  label: string
  description?: string
}

export type MilestoneNodeShape = {
  id: string
  position: XYPosition
  data: MilestoneNodeData
}

const MilestoneNode: FC<MilestoneNodeShape> = (props) => {
  const { id, data } = props
  const { label, description } = data
  const { activeNodeId } = useStore()

  const isActive = activeNodeId === id

  const toggleNodeActive = () => {
    useStore.setState({
      activeNodeId: isActive ? null : id,
      nodeToolsVisible: !isActive,
    })
  }

  const className = isActive ? 'milestone-node-active' : 'milestone-node'

  return (
    <div style={{ position: 'relative' }}>
      <div className={className} onClick={toggleNodeActive}>
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: 10, height: 10, left: -5 }}
          isConnectable
        />

        <Row justify="center" align="middle" style={{ padding: 4 }}>
          <Col>
            <Tooltip title={`${id}: ${description || 'No description.'}`}>
              <Typography.Text strong style={{ fontSize: '0.75em' }}>
                <FlagFilled style={{ color: '#1890ff', marginRight: 4 }} />
                {label}
              </Typography.Text>
            </Tooltip>
          </Col>
        </Row>

        <Handle
          type="source"
          position={Position.Right}
          style={{ width: 10, height: 10, right: -5 }}
          isConnectable
        />
      </div>
    </div>
  )
}

MilestoneNode.displayName = 'MilestoneNode'

export default memo(MilestoneNode)
