import { RefObject } from 'react'
import { CpmTaskResult, ProjectParseResults } from '../../types/graph'
import { runCpm, CpmOutput } from '@quickplan/cpm'
import {
  buildTaskNodes,
  buildMilestoneNodes,
  buildClusterNodes,
  applyClusterMembership,
} from './nodeBuilder'
import { buildDependencyEdges } from './edgeBuilder'
import { nodesForCpm, applyCpmResults, applyCpmToEdges } from './cpmAdapter'
import { layoutNodes } from '../layout/elkLayout'
import { buildResourceInfoMap } from '../resource/resourceUtils'
import { useStore } from '../../store/store'
import {
  parseCalendarConfig,
  buildResourceCalendars,
  getDateConstraints,
  runCalendarScheduling,
} from './calendarAdapter'

export function updateFlowFromDocument(
  data: ProjectParseResults,
  iframe: RefObject<HTMLIFrameElement | null>,
): void {
  // Build edges from dependencies
  const edges = buildDependencyEdges(data.project.dependencies)

  // Build resource info map
  const resourceInfoMap = buildResourceInfoMap(
    data.project.resources,
    data.project.assignments,
  )

  // Build nodes from tasks and milestones
  const taskNodes = buildTaskNodes(
    data.project.tasks,
    data.project.assignments,
    resourceInfoMap,
  )
  const milestoneNodes = buildMilestoneNodes(data.project.milestones)

  // Build cluster nodes and apply membership
  const clusterNodes = buildClusterNodes(data.project.clusters)
  applyClusterMembership(taskNodes, milestoneNodes, data.project.clusters)

  // Combine for CPM calculation (only task/milestone nodes)
  const allNodes = [...taskNodes, ...milestoneNodes]

  // Parse calendar config if present
  const calendarConfig = data.project.calendarConfig
    ? parseCalendarConfig(data.project.calendarConfig)
    : null
  const resourceCalendars = calendarConfig
    ? buildResourceCalendars(data.project)
    : []

  // Apply date constraints before CPM (inject minimum offsets for tasks with `after` attribute)
  if (calendarConfig) {
    const constraints = getDateConstraints(data.project, calendarConfig)
    for (const node of allNodes) {
      const minOffset = constraints.get(node.id)
      if (minOffset !== undefined && minOffset > 0) {
        // Inject a minimum start constraint by adjusting the node's earliest start
        // via its CPM data — we bump durationLow/Likely/High to 0 and add the offset
        // This is handled post-CPM via the scheduler
        ;(node as any).data._dateConstraintOffset = minOffset
      }
    }
  }

  // Store resource data in Zustand
  useStore.setState({
    resourceInfoMap,
    projectAssignments: data.project.assignments,
    calendarConfig,
  })

  // Run dual CPM: planning (original durations) for display, remaining (done=0) for critical path
  void Promise.all([
    runCpm(nodesForCpm(edges, allNodes, 'planning')),
    runCpm(nodesForCpm(edges, allNodes, 'remaining')),
  ])
    .then(([planningResult, remainingResult]) => {
      if ('error' in planningResult) {
        console.error('CPM Error (planning):', planningResult)
        return
      }
      if ('error' in remainingResult) {
        console.error('CPM Error (remaining):', remainingResult)
        return
      }

      const planningCpm = planningResult as CpmOutput
      const remainingCpm = remainingResult as CpmOutput

      // Build done lookup, doneDate lookup, and startDate lookup from task nodes
      const doneSet = new Set<string>()
      const doneDateMap = new Map<string, string>()
      const startDateMap = new Map<string, string>()
      for (const n of allNodes) {
        if (n.data.done) doneSet.add(n.id)
        if (n.data.doneDate) doneDateMap.set(n.id, n.data.doneDate)
        if (n.data.startDate) startDateMap.set(n.id, n.data.startDate)
      }

      // Propagate done status to milestones: a milestone is done when
      // all its predecessors are done
      const predecessors = new Map<string, Set<string>>()
      for (const e of edges) {
        let set = predecessors.get(e.target)
        if (!set) {
          set = new Set()
          predecessors.set(e.target, set)
        }
        set.add(e.source)
      }

      const milestoneIds = new Set(milestoneNodes.map((n) => n.id))

      let changed = true
      while (changed) {
        changed = false
        for (const mId of milestoneIds) {
          if (doneSet.has(mId)) continue
          const preds = predecessors.get(mId)
          if (
            preds &&
            preds.size > 0 &&
            [...preds].every((p) => doneSet.has(p))
          ) {
            doneSet.add(mId)
            changed = true
          }
        }
      }

      // Compute actual completion date for done milestones
      // (latest predecessor doneDate)
      for (const mId of milestoneIds) {
        if (!doneSet.has(mId)) continue
        const preds = predecessors.get(mId)
        if (!preds) continue
        let latestDate: string | undefined
        for (const p of preds) {
          const d = doneDateMap.get(p)
          if (d && (!latestDate || d > latestDate)) latestDate = d
        }
        if (latestDate) doneDateMap.set(mId, latestDate)
      }

      // Apply done status and dates to milestone nodes so they
      // flow through applyCpmResults into the rendered node data
      for (const node of milestoneNodes) {
        if (doneSet.has(node.id)) {
          ;(node.data as any).done = true
          const d = doneDateMap.get(node.id)
          if (d) (node.data as any).doneDate = d
        }
      }

      // Build remaining-run lookup for isCritical
      const remainingMap = new Map(remainingCpm.tasks.map((t) => [t.id, t]))

      // Store CPM results for schedule panel — display values from planning run,
      // isCritical from remaining run
      const cpmResults: Record<string, CpmTaskResult> = {}
      for (const task of planningCpm.tasks) {
        const isDone = doneSet.has(task.id)

        // Apply date constraint: if task has an `after` constraint,
        // ensure its earliestStart is at least that offset
        const constraintNode = allNodes.find((n) => n.id === task.id)
        const constraintOffset = (constraintNode as any)?.data
          ?._dateConstraintOffset as number | undefined
        const effectiveEarliestStart =
          constraintOffset !== undefined
            ? Math.max(task.earliestStart, constraintOffset)
            : task.earliestStart

        cpmResults[task.id] = {
          earliestStart: effectiveEarliestStart,
          earliestFinish:
            effectiveEarliestStart + (task.earliestFinish - task.earliestStart),
          latestStart: task.latestStart,
          latestFinish: task.latestFinish,
          duration: task.expectedDuration,
          plannedDuration: task.expectedDuration,
          slack: task.slack,
          isCritical:
            (remainingMap.get(task.id)?.isCritical ?? false) && !isDone,
          done: isDone || undefined,
          doneDate: doneDateMap.get(task.id),
          startDate: startDateMap.get(task.id),
        }
      }

      // Run calendar-aware scheduling if config is present
      if (calendarConfig) {
        const { scheduledRows, dateAxis } = runCalendarScheduling(
          cpmResults,
          data.project,
          calendarConfig,
          resourceCalendars,
        )
        useStore.setState({ cpmResults, scheduledRows, dateAxis })
      } else {
        useStore.setState({
          cpmResults,
          scheduledRows: null,
          dateAxis: null,
        })
      }

      // Apply CPM results to nodes and edges
      // Display values from planning run, isCritical from remaining run
      const updatedNodes = applyCpmResults(allNodes, planningCpm, remainingCpm)
      // Critical edges from remaining run
      const updatedEdges = applyCpmToEdges(edges, remainingCpm, doneSet)

      // Combine cluster nodes with CPM-updated nodes for layout
      const allNodesWithClusters = [...clusterNodes, ...updatedNodes]

      return layoutNodes<any>(allNodesWithClusters, updatedEdges)
    })
    .then((result) => {
      if (!result) return

      const [nodesPositioned, edgesPositioned] = result

      if (!iframe.current?.contentWindow) {
        console.warn('No contentWindow in iframe, cannot post message')
        return
      }

      // Send to iframe for visualization
      iframe.current.contentWindow.postMessage(
        {
          nodes: JSON.stringify(nodesPositioned),
          edges: JSON.stringify(edgesPositioned),
          calendarConfig: calendarConfig
            ? JSON.stringify(calendarConfig)
            : undefined,
        },
        '*',
      )
    })
    .catch((error) => {
      console.error('Error updating flow:', error)
    })
}
