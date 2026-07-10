import type { SaveDeps } from './save'

/**
 * Detect Tauri runtime without importing any native modules.
 */
export function isTauriRuntime(): boolean {
  if (typeof window === `undefined`)
    return false
  const w = window as Window & {
    isTauri?: boolean
    __TAURI__?: unknown
    __TAURI_INTERNALS__?: unknown
  }
  return Boolean(w.isTauri === true || w.__TAURI__ || w.__TAURI_INTERNALS__)
}

/**
 * Create SaveDeps backed by Tauri plugin-fs + plugin-dialog.
 * Dynamic imports keep @tauri-apps/* out of pure web bundles until used.
 */
export async function createTauriSaveDeps(): Promise<SaveDeps> {
  const [{ writeTextFile, readTextFile, remove }, { save }] = await Promise.all([
    import(`@tauri-apps/plugin-fs`),
    import(`@tauri-apps/plugin-dialog`),
  ])

  return {
    writeTextFile: (path, content) => writeTextFile(path, content),
    readTextFile: path => readTextFile(path),
    remove: path => remove(path),
    showSaveDialog: async (defaultName) => {
      const picked = await save({
        defaultPath: defaultName,
        filters: [{ name: `Markdown`, extensions: [`md`, `markdown`] }],
      })
      return picked ?? null
    },
  }
}

/** Read a UTF-8 text file via Tauri fs plugin. */
export async function readTextFile(path: string): Promise<string> {
  const { readTextFile: read } = await import(`@tauri-apps/plugin-fs`)
  return read(path)
}
