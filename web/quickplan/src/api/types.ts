export type ChartNodePosition = {
  x: number
  y: number
}

export type ChartNode = {
  id: string
  title: string
  description: string
  meta: Record<string, string>
  duration: number
  durationLow: number
  durationLikely: number
  durationHigh: number
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  position: ChartNodePosition
}

export type ChartArrow = {
  id: string
  from: string
  to: string
  criticalPath: boolean
}

export type Chart = {
  nodes: ChartNode[] | null
  arrows: ChartArrow[] | null
  id: string
  title: string
}

export type GraphDependency = {
  firstId: string
  nextId: string
}
