import {
  isAssignment,
  isAttribute,
  isCluster,
  isDependencyChain,
  isDependencySegment,
  isExplodeTask,
  isImplodeTask,
  isMilestone,
  isProject,
  isRemoveEntity,
  isResource,
  isSplitTask,
  isTask,
  Project,
} from '../../language/generated/ast.js'
import { extractDestinationAndName } from '../cli-util.js'
import path from 'node:path'
import { expandToNode, joinToNode, toString } from 'langium/generate'
import fs from 'node:fs'
import { AstNode } from 'langium'

/**
 * Recursively convert an AST node to Project Flow Syntax string.
 * @param node
 */
export const astNodeToProjectFlowSyntax = (node: AstNode): string => {
  if (isProject(node)) {
    return node.lines.map((line) => astNodeToProjectFlowSyntax(line)).join('\n')
  }
  if (isTask(node)) {
    if (!node.attributes || node.attributes.length === 0) {
      return node.name
    }
    const attrString = node.attributes
      .map((attr) => astNodeToProjectFlowSyntax(attr))
      .join(', ')
    return `${node.name}(${attrString})`
  }
  if (isResource(node)) {
    if (!node.attributes || node.attributes.length === 0) {
      return `$${node.name}`
    }
    const attrString = node.attributes
      .map((attr) => astNodeToProjectFlowSyntax(attr))
      .join(', ')
    return `$${node.name}(${attrString})`
  }
  if (isMilestone(node)) {
    if (!node.attributes || node.attributes.length === 0) {
      return `%${node.name}`
    }
    const attrString = node.attributes
      .map((attr) => astNodeToProjectFlowSyntax(attr))
      .join(', ')
    return `%${node.name}(${attrString})`
  }
  if (isCluster(node)) {
    if (!node.items || node.items.length === 0) {
      return `@${node.name}`
    }
    const itemsString = node.items
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    return `@${node.name}: ${itemsString}`
  }
  if (isAttribute(node)) {
    return `${node.name}: ${node.value}`
  }
  if (isDependencyChain(node)) {
    const leftSideStr = node.leftMost
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    const segmentsStr = node.segments
      .map((segment) => astNodeToProjectFlowSyntax(segment))
      .join(' ')
    return `${leftSideStr} ${segmentsStr}`
  }
  if (isDependencySegment(node)) {
    const operatorStr = node.remove ? '~>' : '>'
    const rightSideStr = node.rightSide
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    return `${operatorStr} ${rightSideStr}`
  }
  if (isAssignment(node)) {
    // This one is ambiguous in the AST, in that the left could be Resources and the right Tasks, or vice versa.
    // Just assume Resources on the left and Tasks on the right.
    const operatorStr = node.remove ? '~>' : '>'
    const leftSideStr = node.resources
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    const rightSideStr = node.tasks
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    return `${leftSideStr} ${operatorStr} ${rightSideStr}`
  }
  if (isSplitTask(node)) {
    const taskString = astNodeToProjectFlowSyntax(node.task)
    return node.left ? `* > ${taskString}` : `${taskString} > *`
  }
  if (isRemoveEntity(node)) {
    return `~${astNodeToProjectFlowSyntax(node.entity)}`
  }
  if (isExplodeTask(node)) {
    const taskString = astNodeToProjectFlowSyntax(node.task)
    if (node.count) {
      return `${taskString} ! ${node.count}`
    }
    const rightSideStr = node.tasks
      .map((item) => astNodeToProjectFlowSyntax(item))
      .join(', ')
    return `${taskString} ! ${rightSideStr}`
  }
  if (isImplodeTask(node)) {
    const tasksString = node.tasks
      .map((task) => astNodeToProjectFlowSyntax(task))
      .join(', ')
    const targetString = astNodeToProjectFlowSyntax(node.target)
    return `${tasksString} / ${targetString}`
  }
  throw new Error(`Codegen not implemented for AST node type: '${node.$type}'`)
}

/**
 * Rewrite the AST to Project Flow Syntax.
 * @param project
 * @param filePath
 * @param destination
 */
export function generateProjectFlowSyntax(
  project: Project,
  filePath: string,
  destination: string | undefined,
): string {
  const data = extractDestinationAndName(filePath, destination)
  const generatedFilePath = `${path.join(data.destination, data.name)}.pfs`

  const fileNode = expandToNode`
        ${joinToNode(project.lines, (line) => astNodeToProjectFlowSyntax(line), { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty()

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true })
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode))
  return generatedFilePath
}
