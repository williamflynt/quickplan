import ELK, { ElkNode, LayoutOptions } from 'elkjs/lib/elk.bundled.js'
import { Edge } from '../../types/graph'

const elk = new ELK()

const LAYOUT_OPTIONS: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.nodeNodeBetweenLayers': '35',
  'elk.spacing.nodeNode': '80',
  hierarchyHandling: 'INCLUDE_CHILDREN',
}

export async function layoutNodes<T extends { id: string }>(
  nodes: T[],
  edges: Edge[],
): Promise<[T[], Edge[]]> {
  // Separate nodes by hierarchy
  const parentNodes = nodes.filter((n: any) => n.type === 'group')
  const childNodes = nodes.filter((n: any) => n.type !== 'group')

  // Build map of children by parent ID
  const childrenByParent = new Map<string, any[]>()
  childNodes.forEach((child: any) => {
    if (child.parentId) {
      if (!childrenByParent.has(child.parentId)) {
        childrenByParent.set(child.parentId, [])
      }
      childrenByParent.get(child.parentId)!.push({
        ...child,
        width: 150,
        height: 100,
      })
    }
  })

  // Create ELK graph with hierarchical structure
  const elkChildren = [
    // Root-level nodes (no parent)
    ...childNodes
      .filter((n: any) => !n.parentId)
      .map((n) => ({ ...n, width: 150, height: 100 })),
    // Parent nodes with their children nested
    ...parentNodes.map((p: any) => ({
      ...p,
      children: childrenByParent.get(p.id) || [],
      layoutOptions: {
        'elk.padding': '[top=40,left=10,bottom=5,right=10]',
      },
    })),
  ]

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: elkChildren,
    edges: edges,
  }

  return elk.layout(graph).then((layouted) => {
    if (!layouted.children) {
      throw new Error('no nodes returned from Elk')
    }

    // Flatten ELK's hierarchical output back to flat array for ReactFlow
    const flattenedNodes: any[] = []

    layouted.children.forEach((node) => {
      if (node.children && node.children.length > 0) {
        // This is a parent node with children
        flattenedNodes.push({
          ...node,
          position: { x: node.x || 0, y: node.y || 0 },
          // Preserve style from original node
          style: (nodes.find((n: any) => n.id === node.id) as any)?.style,
        })

        // Add children with relative positions
        node.children.forEach((child) => {
          flattenedNodes.push({
            ...child,
            position: { x: child.x || 0, y: child.y || 0 },
            parentId: node.id,
          })
        })
      } else {
        // Root-level node without children
        flattenedNodes.push({
          ...node,
          position: { x: node.x || 0, y: node.y || 0 },
        })
      }
    })

    return [flattenedNodes as T[], edges]
  })
}
