import React, { FC } from 'react'
import { NodeProps } from '@xyflow/react'

type GroupNodeData = { data: { label: string } } & NodeProps

const GroupNode: FC<GroupNodeData> = ({ data }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 4,
          fontSize: '12px',
          fontWeight: 600,
          color: '#3a5d99',
          padding: '2px 6px',
          zIndex: 10,
        }}
      >
        {data.label}
      </div>
    </div>
  )
}

export default GroupNode
