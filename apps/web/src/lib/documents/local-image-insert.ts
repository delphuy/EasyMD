import {
  dirnameOfDocument,
  isAbsoluteLocalPath,
  isRemoteOrDataImageSrc,
  normalizeDocumentPath,
  toRelativeImageSrc,
} from '@md/desktop-fs'
import { getFileSystemPath } from '@/lib/documents/file-path-map'

export { getFileSystemPath } from '@/lib/documents/file-path-map'

function isTauriRuntime(): boolean {
  return !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^\w.\-()\u4E00-\u9FFF]+/g, `_`) || `image`
  return base.length > 80 ? base.slice(0, 80) : base
}

function extensionOf(file: File): string {
  const fromName = file.name.split(`.`).pop()?.toLowerCase()
  if (fromName && fromName.length <= 5)
    return fromName
  const mime = file.type.split(`/`)[1]
  if (mime === `jpeg`)
    return `jpg`
  return mime || `png`
}

/**
 * Build markdown image syntax that won't break on spaces / parentheses in local paths.
 * CommonMark: destination with special chars should use angle brackets.
 */
export function formatMarkdownImage(src: string, alt: string = ``): string {
  const s = (src || ``).trim()
  if (!s)
    return ``
  // data/http URLs stay as-is; local paths with spaces or () need <...>
  const needsAngle = !isRemoteOrDataImageSrc(s)
    && (/[\s()]/.test(s) || isAbsoluteLocalPath(s))
  const dest = needsAngle ? `<${s}>` : s
  return `![${alt}](${dest})`
}

/**
 * Convert File to a data URL for in-document embedding when no disk path is available.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ``))
    reader.onerror = () => reject(reader.error || new Error(`read failed`))
    reader.readAsDataURL(file)
  })
}

/**
 * Insert local image as markdown src.
 * Priority:
 * 1. Existing filesystem path on the File (picked from disk) → relative or absolute path (never base64)
 * 2. Desktop + saved document → write into `{docBase}.assets/` and return relative path
 * 3. Otherwise → data URL (clipboard screenshots without a path / pure web unsaved)
 */
export async function resolveLocalImageMarkdownSrc(
  file: File,
  documentPath: string | null | undefined,
): Promise<{ src: string, mode: 'relative' | 'absolute' | 'data' }> {
  const docPath = documentPath ? normalizeDocumentPath(documentPath) : ``
  const filePath = getFileSystemPath(file)

  // Prefer real disk path from file picker — never embed as base64
  if (filePath && isAbsoluteLocalPath(filePath)) {
    if (docPath) {
      const rel = toRelativeImageSrc(docPath, filePath)
      if (rel)
        return { src: rel, mode: `relative` }
    }
    return { src: filePath, mode: `absolute` }
  }

  // No path (paste/screenshot): copy next to document when possible
  if (isTauriRuntime() && docPath) {
    try {
      const { writeFile, mkdir } = await import(`@tauri-apps/plugin-fs`)
      const dir = dirnameOfDocument(docPath)
      const baseName = docPath.split(`/`).pop()?.replace(/\.md$/i, ``) || `document`
      const assetsDirName = `${baseName}.assets`
      const assetsDir = dir ? `${dir}/${assetsDirName}` : assetsDirName
      await mkdir(assetsDir, { recursive: true }).catch(() => {})
      const fileName = `${Date.now()}-${sanitizeFileName(file.name || `image.${extensionOf(file)}`)}`
      const abs = `${assetsDir}/${fileName}`
      const bytes = new Uint8Array(await file.arrayBuffer())
      await writeFile(abs, bytes)
      return { src: `./${assetsDirName}/${fileName}`, mode: `relative` }
    }
    catch (error) {
      console.warn(`[local-image] tauri write failed, fallback to data URL`, error)
    }
  }

  const dataUrl = await fileToDataUrl(file)
  return { src: dataUrl, mode: `data` }
}
