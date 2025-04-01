import React, { FC } from 'react'
import { Button } from 'antd'
import { ArrowRightOutlined, PlusSquareOutlined } from '@ant-design/icons'
import api from '../../api/api'
import { SetupChart } from '../ReactFlow/SetupChart'
import { CpmNodeType } from '../ReactFlow/CpmTaskNode'

export const ActivityInsertAfter: FC<{
  graphId: string
  node: CpmNodeType
}> = ({ graphId, node }) => {
  const onClick = () => {
    if (!node) {
      return
    }
    api.graphActivityInsertAfter(graphId, node.id).then((response) => {
      SetupChart(response.data, true)
    })
  }
  return (
    <Button size="small" ghost type="primary" onClick={onClick}>
      <ArrowRightOutlined />
      <PlusSquareOutlined /> Insert After
    </Button>
  )
}

export const ActivityInsertBefore: FC<{
  graphId: string
  node: CpmNodeType
}> = ({ graphId, node }) => {
  const onClick = () => {
    if (!node) {
      return
    }
    api.graphActivityInsertBefore(graphId, node.id).then((response) => {
      SetupChart(response.data, true)
    })
  }
  return (
    <Button size="small" ghost type="primary" onClick={onClick}>
      <PlusSquareOutlined />
      <ArrowRightOutlined /> Insert Before
    </Button>
  )
}
