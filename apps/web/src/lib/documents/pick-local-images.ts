import { isTauriRuntime, normalizeDocumentPath } from '@md/desktop-fs'
import { setFileSystemPath } from '@/lib/documents/file-path-map'
import {
  getTauriDialogDefaultPath,
  setLastOpenDirectory,
} from '@/lib/documents/last-open-directory'

const IMAGE_EXTENSIONS = [`png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`, `ico`] as const

function mimeFromFileName(name: string): string {
  const ext = name.split(`.`).pop()?.toLowerCase() || ``
  switch (ext) {
    case `jpg`:
    case `jpeg`:
      return `image/jpeg`
    case `png`:
      return `image/png`
    case `gif`:
      return `image/gif`
    case `webp`:
      return `image/webp`
    case `svg`:
      return `image/svg+xml`
    case `bmp`:
      return `image/bmp`
    case `ico`:
      return `image/x-icon`
    default:
      return `image/*`
  }
}

function attachPath(file: File, path: string): File {
  setFileSystemPath(file, path)
  return file
}

async function pickWithTauriDialog(): Promise<File[]> {
  const [{ open }, { readFile }] = await Promise.all([
    import(`@tauri-apps/plugin-dialog`),
    import(`@tauri-apps/plugin-fs`),
  ])
  const defaultPath = await getTauriDialogDefaultPath()
  const selected = await open({
    multiple: true,
    defaultPath,
    filters: [{ name: `Images`, extensions: [...IMAGE_EXTENSIONS] }],
  })
  if (!selected)
    return []

  const paths = (Array.isArray(selected) ? selected : [selected])
    .map(p => normalizeDocumentPath(p))
    .filter(Boolean)

  if (paths[0])
    await setLastOpenDirectory(paths[0])

  const files: File[] = []
  for (const path of paths) {
    const bytes = await readFile(path)
    const name = path.split(`/`).pop() || `image.png`
    const file = new File([bytes], name, { type: mimeFromFileName(name) })
    files.push(attachPath(file, path))
  }
  return files
}

function pickWithHtmlInput(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement(`input`)
    input.type = `file`
    input.accept = `image/*`
    input.multiple = true

    let settled = false
    const finish = (files: File[]) => {
      if (settled)
        return
      settled = true
      resolve(files)
    }

    input.addEventListener(`cancel`, () => finish([]))
    input.onchange = () => {
      const list = Array.from(input.files ?? [])
      // Desktop shells may attach .path on File
      for (const file of list) {
        const path = (file as File & { path?: string }).path
        if (path)
          void setLastOpenDirectory(path)
      }
      finish(list)
    }
    input.click()
  })
}

/**
 * Pick local image files.
 * Desktop (Tauri): native dialog with last-directory default, real paths on File.
 * Web: HTML file input (path may be unavailable → insert may use data URL).
 */
export async function pickLocalImages(): Promise<File[]> {
  if (isTauriRuntime()) {
    try {
      return await pickWithTauriDialog()
    }
    catch (error) {
      console.warn(`[pick-local-images] tauri dialog failed, fallback to input`, error)
    }
  }
  return pickWithHtmlInput()
}

/**
 * Dispatch selected files to EditorPanel for insertion (local path / assets / data URL).
 */
export async function pickAndInsertLocalImages(): Promise<void> {
  const files = await pickLocalImages()
  if (!files.length)
    return
  window.dispatchEvent(new CustomEvent(`easymd-insert-local-images`, { detail: files }))
}
