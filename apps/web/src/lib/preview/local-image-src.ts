import {
  isTauriRuntime,
  rewriteHtmlImageSrcs,
} from '@md/desktop-fs'
import { convertFileSrc } from '@tauri-apps/api/core'

/**
 * On desktop (Tauri), rewrite relative/local `<img src>` in preview HTML to asset URLs
 * so the webview can load files from disk.
 *
 * Must run AFTER sanitize that preserves Windows/local paths
 * (see packages/core sanitizeHtml ALLOWED_URI_REGEXP).
 *
 * - Absolute paths (C:/..., /home/...) always converted
 * - Relative paths resolved against the open document path
 * No-op on pure web.
 */
export function applyLocalImageSrcs(
  html: string,
  documentPath: string | null | undefined,
): string {
  if (!html || !isTauriRuntime())
    return html

  try {
    // Prefer native Windows path separators for convertFileSrc reliability
    return rewriteHtmlImageSrcs(html, documentPath, (absolutePath) => {
      const forOs = absolutePath.includes(`:`)
        ? absolutePath.replace(/\//g, `\\`)
        : absolutePath
      return convertFileSrc(forOs)
    })
  }
  catch {
    return html
  }
}
