import { dirnameOfDocument, normalizeDocumentPath } from '@md/desktop-fs'

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
 * - Desktop + document path: write to `{docDir}/{docBase}.assets/{file}` and return relative path
 * - Otherwise: data URL (no cloud upload)
 */
export async function resolveLocalImageMarkdownSrc(
  file: File,
  documentPath: string | null | undefined,
): Promise<{ src: string, mode: 'relative' | 'data' }> {
  const docPath = documentPath ? normalizeDocumentPath(documentPath) : ``

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
