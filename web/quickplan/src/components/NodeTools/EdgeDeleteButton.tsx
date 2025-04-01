import React, { FC } from 'react'
import { Button, Popconfirm } from 'antd'
import api from '../../api/api'
import { SetupChart } from '../ReactFlow/SetupChart'
import { useStore } from '../../store/store'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Edge } from '@xyflow/react'
import { GraphDependency } from '../../api/types'

export const EdgeDeleteButton: FC<{ graphId: string; edge: Edge }> = ({
  graphId,
  edge,
}) => {
  const onClick = () => {
    if (!edge) {
      return
    }
    const dep: GraphDependency = { firstId: edge.source, nextId: edge.target }
    api.graphDependencyDelete(graphId, JSON.stringify(dep)).then((response) => {
      SetupChart(response.data)
      useStore.setState({ activeEdgeId: null })
    })
  }
  return (
    <Popconfirm
      title={`Really delete ${edge.id}?`}
      onConfirm={onClick}
      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
      okText="Delete"
    >
      <Button danger type="text" size="small">
        Delete Dependency
      </Button>
    </Popconfirm>
  )
}
