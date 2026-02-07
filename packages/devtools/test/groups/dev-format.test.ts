import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DevToolsApp } from '../../src/core/app.js'
import { devGroup } from '../../src/groups/dev/index.js'
import type { FormatData } from '../../src/groups/dev/format.js'
import type { GlobalOptions } from '../../src/core/types.js'

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
}

const rootDir = path.resolve(import.meta.dirname, '../../../..')

describe('qpd dev format (real invocation)', () => {
  it('checks formatting of the devtools package', async () => {
    const app = new DevToolsApp(rootDir)
    app.register(devGroup)

    const result = await app.execute(
      'dev',
      'format',
      { package: 'devtools', check: true },
      defaultOptions,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      const data = result.data as FormatData
      expect(data.results).toHaveLength(1)
      expect(data.results[0].package).toBe('@quickplan/devtools')
      expect(Array.isArray(data.results[0].files)).toBe(true)
    }
  }, 30_000)
})
