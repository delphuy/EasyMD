import { convertFileSrc } from '@tauri-apps/api/core'
import { isTauriRuntime, rewriteHtmlImageSrcs } from '@md/desktop-fs'

/**
 * On desktop (Tauri), rewrite relative/local `<img src>` in preview HTML to asset URLs
 * so the webview can load files next to the open document.
 * No-op on pure web or when the document has no filesystem path.
 */
export function applyLocalImageSrcs(
  html: string,
  documentPath: string | null | undefined,
): string {
  if (!html || !documentPath || !isTauriRuntime())
    return html

  try {
    return rewriteHtmlImageSrcs(html, documentPath, path => convertFileSrc(path))
  }
  catch {
    return html
  }
}
