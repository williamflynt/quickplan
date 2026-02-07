import {
  Resource,
  ResourceInfo,
  TaskAssignment,
  SerializedAssignmentIndex,
} from '../../types/graph'

const RESOURCE_COLORS = [
  '#4e79a7', // steel blue
  '#7b68ee', // medium slate blue
  '#b07aa1', // muted purple
  '#76b7b2', // teal
  '#f28e2b', // warm orange
  '#9c755f', // brown
  '#ff9da7', // rose pink
  '#6c5ce7', // purple
  '#00b894', // mint (distinct from CPM green)
  '#636e72', // grey
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function resourceColor(name: string): string {
  return RESOURCE_COLORS[hashString(name) % RESOURCE_COLORS.length]
}

export function resourceAbbrev(name: string): string {
  if (name.length <= 2) return name.toUpperCase()
  // Use first letter + first consonant after it, or just first two letters
  const upper = name[0].toUpperCase()
  for (let i = 1; i < name.length; i++) {
    if (!'aeiouAEIOU'.includes(name[i])) {
      return upper + name[i].toUpperCase()
    }
  }
  return (name[0] + name[1]).toUpperCase()
}

export function buildResourceInfoMap(
  resources: Record<string, Resource>,
  assignments: SerializedAssignmentIndex,
): Map<string, ResourceInfo> {
  const map = new Map<string, ResourceInfo>()

  // Build from declared resources
  for (const [name, resource] of Object.entries(resources)) {
    const attrs = resource as Record<string, unknown>
    map.set(name, {
      name,
      role: String(attrs.role || ''),
      maxHours: Number(attrs.maxHours) || 40,
      rate: Number(attrs.rate) || 0,
      color: String(attrs.color || '') || resourceColor(name),
    })
  }

  // Ensure any resource referenced in assignments also has an entry
  for (const assignment of assignments) {
    if (
      assignment.source.type === 'Resource' &&
      !map.has(assignment.source.name)
    ) {
      const name = assignment.source.name
      map.set(name, {
        name,
        role: '',
        maxHours: 40,
        rate: 0,
        color: resourceColor(name),
      })
    }
  }

  return map
}

export function getTaskAssignments(
  taskName: string,
  assignments: SerializedAssignmentIndex,
  resourceInfoMap: Map<string, ResourceInfo>,
): TaskAssignment[] {
  return assignments
    .filter((a) => a.target.type === 'Task' && a.target.name === taskName)
    .map((a) => {
      const info = resourceInfoMap.get(a.source.name)
      return {
        resourceName: a.source.name,
        resourceColor: info?.color || resourceColor(a.source.name),
      }
    })
}
