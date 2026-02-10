import { DocumentState, EmptyFileSystem } from 'langium'
import { startLanguageServer } from 'langium/lsp'
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  Diagnostic,
  NotificationType,
} from 'vscode-languageserver/browser.js'
import { createProjectFlowSyntaxServices } from './project-flow-syntax-module.js'
import { Project } from './generated/ast.js'
import { extractEntities } from '../util/extractEntities.js'

declare const self: DedicatedWorkerGlobalScope

const messageReader = new BrowserMessageReader(self)
const messageWriter = new BrowserMessageWriter(self)

const connection = createConnection(messageReader, messageWriter)

const { shared, ProjectFlowSyntax } = createProjectFlowSyntaxServices({
  connection,
  ...EmptyFileSystem,
})

startLanguageServer(shared)

// Send a notification with the serialized AST after every document change
type DocumentChange = {
  uri: string
  content: string
  diagnostics: Diagnostic[]
}
const documentChangeNotification = new NotificationType<DocumentChange>(
  'browser/DocumentChange',
)
const jsonSerializer = ProjectFlowSyntax.serializer.JsonSerializer
shared.workspace.DocumentBuilder.onBuildPhase(
  DocumentState.Validated,
  (documents) => {
    for (const document of documents) {
      const module = document.parseResult.value as Project
      const notificationContent = {
        uri: document.uri.toString(),
        content: jsonSerializer.serialize(module, {
          sourceText: true,
          textRegions: true,
        }),
        diagnostics: document.diagnostics ?? [],
        project: JSON.stringify(extractEntities(document.parseResult.value)),
      }
      void connection.sendNotification(
        documentChangeNotification,
        notificationContent,
      )
    }
  },
)
