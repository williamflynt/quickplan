export type ChartNodePosition = {
    x: number,
    y: number,
}

export type ChartNode = {
    id: string,
    duration: number,
    label: string,
    earliestStart: number,
    earliestFinish: number,
    latestStart: number,
    latestFinish: number,
    slack: number,
    position: ChartNodePosition,
}

export type ChartArrow = {
    id: string
    from: string
    to: string
    criticalPath: boolean
}

export type Chart = {
    nodes: ChartNode[]
    arrows: ChartArrow[]
    title: string
}

export type ChartExample = Chart & { dot: string }