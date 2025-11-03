import { RefObject } from 'react'
import { ProjectParseResults } from '../../types/graph'
import { runCpm } from '../../cpm/cpm'
import { CpmError } from '../../cpm/types'
import { buildTaskNodes, buildMilestoneNodes, buildClusterNodes, applyClusterMembership } from './nodeBuilder'
import { buildDependencyEdges } from './edgeBuilder'
import { nodesForCpm, applyCpmResults, applyCpmToEdges } from './cpmAdapter'
import { layoutNodes } from '../layout/elkLayout'

export function updateFlowFromDocument(
  data: ProjectParseResults,
  iframe: RefObject<HTMLIFrameElement | null>,
): void {
  // Build edges from dependencies
  const edges = buildDependencyEdges(data.project.dependencies)

  // Build nodes from tasks and milestones
  const taskNodes = buildTaskNodes(data.project.tasks)
  const milestoneNodes = buildMilestoneNodes(data.project.milestones)

  // Build cluster nodes and apply membership
  const clusterNodes = buildClusterNodes(data.project.clusters)
  applyClusterMembership(taskNodes, milestoneNodes, data.project.clusters)

  // Combine for CPM calculation (only task/milestone nodes)
  const allNodes = [...taskNodes, ...milestoneNodes]

  // Run CPM calculation
  void runCpm(nodesForCpm(edges, allNodes))
    .then((computed) => {
      if ('error' in computed) {
        console.error('CPM Error:', computed)
        return
      }

      // Apply CPM results to nodes and edges
      const updatedNodes = applyCpmResults(allNodes, computed)
      const updatedEdges = applyCpmToEdges(edges, computed)

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
        },
        '*',
      )
    })
    .catch((error) => {
      console.error('Error updating flow:', error)
    })
}
