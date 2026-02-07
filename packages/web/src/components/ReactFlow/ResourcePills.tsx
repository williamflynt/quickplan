import React, { FC } from 'react'
import { Tooltip } from 'antd'
import { TaskAssignment } from '../../types/graph'

function abbreviate(name: string): string {
  if (name.length <= 2) return name.toUpperCase()
  const upper = name[0].toUpperCase()
  for (let i = 1; i < name.length; i++) {
    if (!'aeiouAEIOU'.includes(name[i])) {
      return upper + name[i].toUpperCase()
    }
  }
  return (name[0] + name[1]).toUpperCase()
}

type Props = {
  assignments: TaskAssignment[]
  maxVisible?: number
}

export const ResourcePills: FC<Props> = ({ assignments, maxVisible = 3 }) => {
  if (!assignments.length) return null

  const visible = assignments.slice(
    0,
    maxVisible - (assignments.length > maxVisible ? 1 : 0),
  )
  const overflow = assignments.length - visible.length

  return (
    <div className="resource-pills">
      {visible.map((a) => (
        <Tooltip key={a.resourceName} title={a.resourceName}>
          <span
            className="resource-pill"
            style={{ backgroundColor: a.resourceColor }}
          >
            {abbreviate(a.resourceName)}
          </span>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Tooltip
          title={assignments
            .slice(visible.length)
            .map((a) => a.resourceName)
            .join(', ')}
        >
          <span className="resource-pill" style={{ backgroundColor: '#666' }}>
            +{overflow}
          </span>
        </Tooltip>
      )}
    </div>
  )
}
