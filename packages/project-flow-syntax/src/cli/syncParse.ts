import { createProjectFlowSyntaxServices } from '../language/project-flow-syntax-module.js'
import { EmptyFileSystem } from 'langium'
import { Project } from '../language/generated/ast.js'
import { AstNode } from 'langium'

const services = createProjectFlowSyntaxServices({ ...EmptyFileSystem })
const parser = services.ProjectFlowSyntax.parser.LangiumParser

/**
 * Convert source to JSON AST - synchronous version without validations.
 */
export const syncParse = (source: string): string => {
  const project = parser.parse<Project>(source)
  if (project.parserErrors?.length > 0) {
    return JSON.stringify({ errors: project.parserErrors })
  }
  return generateJsonAst(project.value)
}

/**
 * Type guard to check if a value is an AstNode
 */
const isAstNode = (value: unknown): value is AstNode => {
  return !!value && typeof value === 'object' && '$type' in value
}

/**
 * Convert AstNode to a plain JavaScript object ready for JSON serialization.
 * Removes circular references and internal properties.
 */
const astNodeToPlainObject = (node: AstNode): Record<string, any> => {
  if (!node) return {}

  const result: Record<string, any> = {
    type: node.$type,
  }

  for (const [key, value] of Object.entries(node)) {
    // Skip internal properties (keys that start with $).
    if (key.startsWith('$')) continue

    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (isAstNode(item)) {
          return astNodeToPlainObject(item)
        }
        return item
      })
    } else if (isAstNode(value)) {
      result[key] = astNodeToPlainObject(value)
    } else if (key !== 'parent' && value !== undefined) {
      result[key] = value
    } else {
      console.warn(`unexpected key:value: ${key}: ${value}`)
    }
  }

  return result
}

/**
 * Generate a JSON AST from our root AST node.
 */
const generateJsonAst = (project: Project): string => {
  const plainObject = astNodeToPlainObject(project)
  return JSON.stringify(plainObject)
}
