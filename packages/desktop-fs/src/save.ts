import { normalizeDocumentPath } from './path'

export type SaveStatus = 'saved' | 'cancelled' | 'failed'

export interface SaveResult {
  status: SaveStatus
  path?: string
  error?: string
}

export interface SaveDeps {
  writeTextFile: (path: string, content: string) => Promise<void>
  readTextFile: (path: string) => Promise<string>
  remove: (path: string) => Promise<void>
  showSaveDialog?: (defaultName: string) => Promise<string | null>
}

export interface SaveMarkdownDocumentOptions {
  content: string
  path?: string | null
  defaultName?: string
}

/**
 * Safe save: resolve path (dialog if needed) → write temp → read-back verify → write target.
 * Failures never report success; temp file is best-effort cleaned up.
 */
export async function saveMarkdownDocument(
  deps: SaveDeps,
  options: SaveMarkdownDocumentOptions,
): Promise<SaveResult> {
  let path = options.path ? normalizeDocumentPath(options.path) : ``
  if (!path) {
    if (!deps.showSaveDialog)
      return { status: `failed`, error: `No path and no dialog` }
    const picked = await deps.showSaveDialog(options.defaultName ?? `untitled.md`)
    if (!picked)
      return { status: `cancelled` }
    path = normalizeDocumentPath(picked)
  }
  const temp = `${path}.easymd.tmp.${Date.now()}`
  try {
    await deps.writeTextFile(temp, options.content)
    const written = await deps.readTextFile(temp)
    if (written !== options.content)
      throw new Error(`Write verification failed`)
    await deps.writeTextFile(path, options.content)
    await deps.remove(temp).catch(() => {})
    return { status: `saved`, path }
  }
  catch (e) {
    await deps.remove(temp).catch(() => {})
    return { status: `failed`, error: e instanceof Error ? e.message : String(e) }
  }
}
