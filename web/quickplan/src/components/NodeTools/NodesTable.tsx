import React, { FC } from 'react'
import { useStore } from '../../store/store'
import { Table, Typography } from 'antd'
import { CpmNodeType } from '../ReactFlow/CpmTaskNode'

export const NodesTable: FC = () => {
  const { activeNodeId, nodes } = useStore()

  const stringSorter = (s1: string, s2: string) => {
    if (s1 > s2) {
      return 1
    }
    if (s2 > s1) {
      return -1
    }
    return 0
  }

  const columns = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: CpmNodeType, b: CpmNodeType) => stringSorter(a.id, b.id),
      render: (id: string) => {
        if (id === activeNodeId) {
          return <Typography.Text strong>{id}</Typography.Text>
        }
        return <Typography.Link>{id}</Typography.Link>
      },
    },
    {
      title: 'Title',
      dataIndex: ['data', 'label'],
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: ['data', 'description'],
      key: 'description',
    },
    {
      title: 'Duration',
      dataIndex: ['data', 'cpm', 'duration'],
      key: 'cpm.duration',
    },
    {
      title: 'Duration Low',
      dataIndex: ['data', 'cpm', 'durationLow'],
      key: 'cpm.durationLow',
    },
    {
      title: 'Duration Likely',
      dataIndex: ['data', 'cpm', 'durationLikely'],
      key: 'cpm.durationLikely',
    },
    {
      title: 'Duration High',
      dataIndex: ['data', 'cpm', 'durationHigh'],
      key: 'cpm.durationHigh',
    },
  ]

  const selectNodeOnRow = (record: { id: string }) => {
    return {
      onClick: () => {
        useStore.setState({ activeNodeId: record.id })
      },
    }
  }

  return (
    <Table
      dataSource={nodes}
      columns={columns}
      pagination={false}
      size="small"
      onRow={selectNodeOnRow}
      rowKey={(r: CpmNodeType) => r.id}
    />
  )
}
