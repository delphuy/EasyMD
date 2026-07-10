import type { SaveDeps } from '@md/desktop-fs'
import { createTauriSaveDeps, isTauriRuntime } from '@md/desktop-fs'
import { downloadFile } from '@md/shared/utils/fileHelpers'

function basename(path: string): string {
  const normalized = path.replace(/\\/g, `/`)
  return normalized.split(`/`).pop() || path
}

/**
 * Browser fallback SaveDeps:
 * - temp files stay in memory for write-verify
 * - showSaveDialog prefers File System Access API when available
 * - final write uses the file handle when present, otherwise downloads a blob
 */
export function createWebSaveDeps(): SaveDeps {
  const memory = new Map<string, string>()
  let saveHandle: FileSystemFileHandle | null = null
  let saveHandleName: string | null = null

  return {
    async writeTextFile(path, content) {
      if (path.includes(`.easymd.tmp.`)) {
        memory.set(path, content)
        return
      }

      if (
        saveHandle
        && saveHandleName
        && (path === saveHandleName || basename(path) === saveHandleName || path.endsWith(`/${saveHandleName}`))
      ) {
        const writable = await saveHandle.createWritable()
        await writable.write(content)
        await writable.close()
        memory.set(path, content)
        return
      }

      downloadFile(content, basename(path) || `untitled.md`, `text/markdown;charset=utf-8`)
      memory.set(path, content)
    },

    async readTextFile(path) {
      if (!memory.has(path))
        throw new Error(`ENOENT: ${path}`)
      return memory.get(path)!
    },

    async remove(path) {
      memory.delete(path)
    },

    async showSaveDialog(defaultName) {
      saveHandle = null
      saveHandleName = null

      if (typeof window !== `undefined` && typeof window.showSaveFilePicker === `function`) {
        try {
          saveHandle = await window.showSaveFilePicker({
            suggestedName: defaultName,
            types: [{
              description: `Markdown`,
              accept: { 'text/markdown': [`.md`, `.markdown`] },
            }],
          })
          saveHandleName = saveHandle.name
          return saveHandle.name
        }
        catch (error) {
          // User cancelled the picker
          if (error instanceof DOMException && error.name === `AbortError`)
            return null
          // Unsupported / permission issues → fall through to download
        }
      }

      // No File System Access API: accept default name and download on write
      return defaultName
    },
  }
}

/** Prefer Tauri fs/dialog; otherwise browser download / File System Access. */
export async function createSaveDeps(): Promise<SaveDeps> {
  if (isTauriRuntime())
    return createTauriSaveDeps()
  return createWebSaveDeps()
}
