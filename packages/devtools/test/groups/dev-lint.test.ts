import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DevToolsApp } from '../../src/core/app.js'
import { devGroup } from '../../src/groups/dev/index.js'
import { parseEslintJson } from '../../src/groups/dev/lint.js'
import type { LintData } from '../../src/groups/dev/lint.js'
import type { GlobalOptions } from '../../src/core/types.js'

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
}

const rootDir = path.resolve(import.meta.dirname, '../../../..')

describe('parseEslintJson', () => {
  it('parses eslint JSON output into LintIssues', () => {
    const input = JSON.stringify([
      {
        filePath: '/home/user/project/src/foo.ts',
        messages: [
          {
            line: 10,
            column: 5,
            severity: 2,
            message: 'Unexpected console statement.',
            ruleId: 'no-console',
          },
          {
            line: 15,
            column: 1,
            severity: 1,
            message: 'Missing return type.',
            ruleId: '@typescript-eslint/explicit-function-return-type',
          },
        ],
        errorCount: 1,
        warningCount: 1,
        fixableErrorCount: 0,
        fixableWarningCount: 1,
      },
    ])

    const result = parseEslintJson(input, '/home/user/project')
    expect(result.files).toBe(1)
    expect(result.errors).toBe(1)
    expect(result.warnings).toBe(1)
    expect(result.fixable).toBe(1)
    expect(result.issues).toHaveLength(2)
    expect(result.issues[0]).toEqual({
      file: 'src/foo.ts',
      line: 10,
      column: 5,
      severity: 'error',
      message: 'Unexpected console statement.',
      rule: 'no-console',
    })
    expect(result.issues[1].severity).toBe('warning')
  })

  it('handles empty JSON array', () => {
    const result = parseEslintJson('[]', '/root')
    expect(result.files).toBe(0)
    expect(result.issues).toHaveLength(0)
  })

  it('handles invalid JSON gracefully', () => {
    const result = parseEslintJson('not-json', '/root')
    expect(result.files).toBe(0)
    expect(result.issues).toHaveLength(0)
  })

  it('handles null ruleId', () => {
    const input = JSON.stringify([
      {
        filePath: '/root/src/a.ts',
        messages: [
          { line: 1, column: 1, severity: 2, message: 'Parse error', ruleId: null },
        ],
        errorCount: 1,
        warningCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
      },
    ])
    const result = parseEslintJson(input, '/root')
    expect(result.issues[0].rule).toBe('')
  })
})

describe('qpd dev lint (real invocation)', () => {
  it('lints the devtools package and returns structured results', async () => {
    const app = new DevToolsApp(rootDir)
    app.register(devGroup)

    const result = await app.execute(
      'dev',
      'lint',
      { package: 'devtools' },
      defaultOptions,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      const data = result.data as LintData
      expect(data.results).toHaveLength(1)
      expect(data.results[0].package).toBe('@quickplan/devtools')
      expect(typeof data.results[0].files).toBe('number')
      expect(typeof data.results[0].errors).toBe('number')
      expect(typeof data.results[0].warnings).toBe('number')
      expect(typeof data.summary.errors).toBe('number')
      expect(typeof data.summary.warnings).toBe('number')
    }
  }, 30_000)
})
