// Expose to GraalJS.
import { syncParse } from '../syncParse.js'
import { extractEntities } from '../../util/extractEntities.js'

;(globalThis as any).syncParse = syncParse
;(globalThis as any).snapshot = extractEntities
