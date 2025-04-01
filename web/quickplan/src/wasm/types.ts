export type WasmCpmInput = {
  uid: string
  title: string
  description: string | undefined
  meta: Record<string, string>
  durationLow: number
  durationLikely: number
  durationHigh: number
  predecessors: string[]
}

/**
 * The `runCpm` from WASM returns an object like `{ error: string, chart: Chart }`.
 * Chart is laid out like:
 *
 * type Chart struct {
 *    Nodes  []*Node `json:"nodes"`
 *    Arrows []Arrow `json:"arrows"`
 *    Id     string  `json:"id"`
 *    Title  string  `json:"title"`
 * }
 *
 * type Node struct {
 *    Id          string            `json:"id"`
 *    Title       string            `json:"title"`
 *    Description string            `json:"description"`
 *    Meta        map[string]string `json:"meta"`
 *    Position    NodePosition      `json:"position"`
 *
 *    Duration       float64 `json:"duration"`
 *    DurationLow    int     `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Task in arbitrary units.
 *    DurationLikely int     `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Task in arbitrary units.
 *    DurationHigh   int     `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Task in arbitrary units.
 *
 *    Label          string  `json:"label"`
 *    EarliestStart  float64 `json:"earliestStart"`
 *    EarliestFinish float64 `json:"earliestFinish"`
 *    LatestStart    float64 `json:"latestStart"`
 *    LatestFinish   float64 `json:"latestFinish"`
 *    Slack          float64 `json:"slack"`
 *
 *    ...
 * }
 *
 * type Arrow struct {
 *    Id           string `json:"id"`
 *    From         string `json:"from"`
 *    To           string `json:"to"`
 *    CriticalPath bool   `json:"criticalPath"`
 * }
 */

export type CpmData = {
  duration: number
  durationLow: number
  durationLikely: number
  durationHigh: number
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
}

export type WasmNode = {
  id: string
  title: string
  description: string
  label: string
  meta: Record<string, string>
  position: { x: number; y: number }
} & CpmData

export type WasmArrow = {
  id: string
  from: string
  to: string
  criticalPath: boolean
}

export type WasmCpmOutput = {
  nodes: WasmNode[]
  arrows: WasmArrow[]
  id: string // ID of the chart itself.
  title: string // Title of the chart itself.
}
