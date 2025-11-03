import { describe, test, expect } from 'vitest'
import { runCpm } from './cpm'
import { CpmInput } from './types'

describe('CPM Critical Path Calculation', () => {
  test('should identify critical path edges correctly', async () => {
    const tasks: CpmInput[] = [
      {
        id: 'Task:Design',
        durationLow: 2,
        durationLikely: 3,
        durationHigh: 5,
        successors: ['Task:Build'],
      },
      {
        id: 'Task:Build',
        durationLow: 5,
        durationLikely: 8,
        durationHigh: 12,
        successors: ['Task:Test'],
      },
      {
        id: 'Task:Test',
        durationLow: 2,
        durationLikely: 3,
        durationHigh: 4,
        successors: ['Milestone:Complete'],
      },
      {
        id: 'Milestone:Complete',
        durationLow: 0,
        durationLikely: 0,
        durationHigh: 0,
        successors: [],
      },
      {
        id: 'Task:WriteTests',
        durationLow: 2,
        durationLikely: 3,
        durationHigh: 4,
        successors: ['Task:Test'],
      },
    ]

    const result = await runCpm(tasks)

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return

    expect(result.criticalPaths.length).toBeGreaterThan(0)

    const criticalNodes = result.tasks.filter((t) => t.isCritical)
    criticalNodes.forEach((node) => {
      expect(Math.abs(node.slack)).toBeLessThan(0.01)
    })

    const criticalIds = criticalNodes.map((n) => n.id).sort()
    expect(criticalIds).toContain('Task:Design')
    expect(criticalIds).toContain('Task:Build')
    expect(criticalIds).toContain('Task:Test')
    expect(criticalIds).toContain('Milestone:Complete')

    const writeTests = result.tasks.find((t) => t.id === 'Task:WriteTests')
    expect(writeTests?.isCritical).toBe(false)
    expect(writeTests?.slack).toBeGreaterThan(0)

    const criticalEdges = result.edges.filter((e) => e.isCritical)
    const criticalEdgeIds = criticalEdges.map((e) => e.id).sort()

    expect(criticalEdgeIds).toContain('Task:Design > Task:Build')
    expect(criticalEdgeIds).toContain('Task:Build > Task:Test')
    expect(criticalEdgeIds).toContain('Task:Test > Milestone:Complete')

    const writeTestsEdge = result.edges.find(
      (e) => e.id === 'Task:WriteTests > Task:Test',
    )
    expect(writeTestsEdge?.isCritical).toBe(false)
  })

  test('should generate edge IDs that match the format used by edgeBuilder', async () => {
    const tasks: CpmInput[] = [
      {
        id: 'Task:A',
        durationLow: 1,
        durationLikely: 2,
        durationHigh: 3,
        successors: ['Task:B'],
      },
      {
        id: 'Task:B',
        durationLow: 1,
        durationLikely: 2,
        durationHigh: 3,
        successors: [],
      },
    ]

    const result = await runCpm(tasks)

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return

    const edge = result.edges.find(
      (e) => e.from === 'Task:A' && e.to === 'Task:B',
    )
    expect(edge).toBeDefined()
    expect(edge?.id).toBe('Task:A > Task:B')

    const expectedEdgeId = ['Task:A', 'Task:B'].join(' > ')
    expect(edge?.id).toBe(expectedEdgeId)
  })

  test('should handle milestones with zero duration correctly', async () => {
    const tasks: CpmInput[] = [
      {
        id: 'Task:Start',
        durationLow: 5,
        durationLikely: 5,
        durationHigh: 5,
        successors: ['Milestone:Mid'],
      },
      {
        id: 'Milestone:Mid',
        durationLow: 0,
        durationLikely: 0,
        durationHigh: 0,
        successors: ['Task:End'],
      },
      {
        id: 'Task:End',
        durationLow: 5,
        durationLikely: 5,
        durationHigh: 5,
        successors: [],
      },
    ]

    const result = await runCpm(tasks)

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return

    expect(result.tasks.every((t) => t.isCritical)).toBe(true)
    expect(result.edges.every((e) => e.isCritical)).toBe(true)

    const milestone = result.tasks.find((t) => t.id === 'Milestone:Mid')
    expect(milestone?.expectedDuration).toBe(0)
  })
})
