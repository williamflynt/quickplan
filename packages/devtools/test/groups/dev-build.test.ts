import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DevToolsApp } from '../../src/core/app.js'
import { devGroup } from '../../src/groups/dev/index.js'
import type { BuildData } from '../../src/groups/dev/build.js'
import type { GlobalOptions } from '../../src/core/types.js'

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
}

const rootDir = path.resolve(import.meta.dirname, '../../../..')

describe('qpd dev build (real invocation)', () => {
  it('builds the devtools package', async () => {
    const app = new DevToolsApp(rootDir)
    app.register(devGroup)

    const result = await app.execute(
      'dev',
      'build',
      { package: 'devtools' },
      defaultOptions,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      const data = result.data as BuildData
      expect(data.results).toHaveLength(1)
      expect(data.results[0].package).toBe('@quickplan/devtools')
      expect(data.results[0].success).toBe(true)
    }
  }, 60_000)
})
