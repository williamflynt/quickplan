import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory'

export const SAMPLE_CODE = `# Calendar configuration
project(startDate: "2026-03-02", workdays: "m,t,w,th,f", holidays: "2026-03-17")

# Team with roles, workdays, and PTO
$Alice(role: "Lead", pto: "2026-03-10,2026-03-11")
$Bob(role: "Frontend", workdays: "t,w,th,f,s")
$Carol(role: "QA")

# Tasks with three-point estimates (low likely high)
Requirements 2 3 5 "Gather requirements"
Architecture 3 5 8
API 5 8 12
UI 4 6 10
Database 3 4 6
Integration 2 3 5
Testing 3 4 6
Deploy 1 1 2

# Dependencies
Requirements > Architecture
Architecture > API, UI, Database
API, Database > Integration
UI, Integration > Testing > Deploy

# Assignments
$Alice > Requirements, Architecture, API
$Bob > UI
$Carol > Integration, Testing, Deploy

# Clusters
@planning: Requirements, Architecture
@build: API, UI, Database
@quality: Integration, Testing, Deploy

# Milestone and date constraint
Deploy > %Launch
Deploy(after: "2026-04-15")
`

export const configureMonacoWorkers = () => {
  useWorkerFactory({
    ignoreMapping: true,
    workerLoaders: {
      editorWorkerService: () =>
        new Worker(
          new URL(
            'monaco-editor/esm/vs/editor/editor.worker.js',
            import.meta.url,
          ),
          { type: 'module' },
        ),
    },
  })
}
