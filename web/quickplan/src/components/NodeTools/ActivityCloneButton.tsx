import React, { FC } from 'react'
import { Button } from 'antd'
import { UpSquareOutlined } from '@ant-design/icons'
import api from '../../api/api'
import { SetupChart } from '../ReactFlow/SetupChart'
import { CpmNodeType } from '../ReactFlow/CpmTaskNode'

export const ActivityCloneButton: FC<{
  graphId: string
  node: CpmNodeType
}> = ({ graphId, node }) => {
  const onClick = () => {
    if (!node) {
      return
    }
    api.graphActivityClone(graphId, node.id).then((response) => {
      SetupChart(response.data, true)
    })
  }
  return (
    <Button size="small" ghost type="primary" onClick={onClick}>
      <UpSquareOutlined /> Clone
    </Button>
  )
}
