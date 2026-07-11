import { normalizeDocumentPath } from './path'

/** Remote / in-memory schemes that should not be joined with a document directory. */
const REMOTE_OR_DATA_SCHEME = /^(?:https?:|data:|blob:|asset:|tauri:|chrome-extension:|moz-extension:)/i

/**
 * True when the image src is already a network, data, or asset protocol URL.
 */
export function isRemoteOrDataImageSrc(src: string): boolean {
  return REMOTE_OR_DATA_SCHEME.test(src.trim())
}

/**
 * True for absolute filesystem paths (POSIX or Windows, with optional file://).
 */
export function isAbsoluteLocalPath(src: string): boolean {
  const p = normalizeDocumentPath(src)
  if (!p)
    return false
  if (/^[A-Z]:\//i.test(p))
    return true
  // POSIX absolute (and UNC-style //server/share → after normalize may still start with /)
  if (p.startsWith(`/`))
    return true
  return false
}

/**
 * True when src should be resolved against the document directory.
 */
export function isRelativeImagePath(src: string): boolean {
  const s = src.trim()
  if (!s)
    return false
  if (isRemoteOrDataImageSrc(s))
    return false
  if (isAbsoluteLocalPath(s))
    return false
  return true
}

/** Parent directory of a normalized document path (empty if none). */
export function dirnameOfDocument(documentPath: string): string {
  const p = normalizeDocumentPath(documentPath)
  if (!p)
    return ``
  const idx = p.lastIndexOf(`/`)
  if (idx <= 0)
    return idx === 0 ? `/` : ``
  return p.slice(0, idx)
}

/**
 * Join directory + relative segment with basic `..` / `.` resolution.
 * Inputs are expected to use `/` separators (normalized).
 */
export function joinPath(dir: string, relative: string): string {
  const rel = relative.replace(/\\/g, `/`).replace(/^\.\//, ``)
  // Keep leading empty segment for absolute POSIX roots
  const parts = dir
    ? (dir === `/` ? [``] : dir.split(`/`))
    : []

  for (const seg of rel.split(`/`)) {
    if (!seg || seg === `.`)
      continue
    if (seg === `..`) {
      if (parts.length === 0)
        continue
      // Do not pop Windows drive root like "C:"
      if (parts.length === 1 && /^[A-Z]:$/i.test(parts[0]!))
        continue
      // Do not pop below POSIX root
      if (parts.length === 1 && parts[0] === ``)
        continue
      parts.pop()
      continue
    }
    parts.push(seg)
  }

  if (parts.length === 0)
    return ``
  // Windows drive-only
  if (parts.length === 1 && /^[A-Z]:$/i.test(parts[0]!))
    return `${parts[0]}/`
  // POSIX root only
  if (parts.length === 1 && parts[0] === ``)
    return `/`
  return parts.join(`/`)
}

/**
 * Split a normalized absolute path into comparable segments.
 * Windows: `C:/a/b` → [`C:`, `a`, `b`]
 * POSIX: `/home/u` → [``, `home`, `u`] (empty first = root)
 */
function pathSegments(normalizedAbs: string): string[] {
  if (normalizedAbs === `/`)
    return [``]
  return normalizedAbs.split(`/`)
}

/**
 * Build a markdown-friendly relative `src` from an absolute image path
 * when it shares a common root with the document directory.
 *
 * Returns null when paths are on different roots (e.g. different drives).
 */
export function toRelativeImageSrc(
  documentPath: string | null | undefined,
  absoluteImagePath: string,
): string | null {
  const doc = documentPath ? normalizeDocumentPath(documentPath) : ``
  const abs = normalizeDocumentPath(absoluteImagePath)
  if (!doc || !abs || !isAbsoluteLocalPath(abs))
    return null

  const dir = dirnameOfDocument(doc)
  if (!dir)
    return null

  // Different Windows drives → cannot form a relative path
  const docDrive = dir.match(/^([A-Z]:)/i)?.[1]?.toUpperCase()
  const imgDrive = abs.match(/^([A-Z]:)/i)?.[1]?.toUpperCase()
  if (docDrive && imgDrive && docDrive !== imgDrive)
    return null

  const baseParts = pathSegments(dir)
  const absParts = pathSegments(abs)

  let i = 0
  while (i < baseParts.length && i < absParts.length && baseParts[i] === absParts[i])
    i++

  // Must share at least the root/drive segment
  if (i === 0)
    return null

  const up = baseParts.length - i
  const down = absParts.slice(i)
  const relParts = [...Array.from({ length: up }).fill(`..`), ...down]
  if (relParts.length === 0)
    return `./`

  const rel = relParts.join(`/`)
  return rel.startsWith(`.`) ? rel : `./${rel}`
}

/**
 * Resolve an image `src` against a document filesystem path.
 *
 * Returns:
 * - remote/data/blob/asset URLs unchanged
 * - absolute local paths normalized
 * - relative paths joined to the document directory (when document path is known)
 * - `null` when the src is empty, or relative without a document path
 */
export function resolveImagePath(
  documentPath: string | null | undefined,
  imageSrc: string,
): string | null {
  const src = imageSrc.trim()
  if (!src)
    return null

  if (isRemoteOrDataImageSrc(src))
    return src

  if (isAbsoluteLocalPath(src))
    return normalizeDocumentPath(src)

  const doc = documentPath ? normalizeDocumentPath(documentPath) : ``
  if (!doc)
    return null

  const dir = dirnameOfDocument(doc)
  if (!dir)
    return null

  return normalizeDocumentPath(joinPath(dir, src))
}

/**
 * Whether `resolved` is a local filesystem path that needs convertFileSrc for webview display.
 */
export function needsAssetConversion(resolved: string | null | undefined): boolean {
  if (!resolved)
    return false
  if (isRemoteOrDataImageSrc(resolved))
    return false
  return isAbsoluteLocalPath(resolved) || !/^[a-z][a-z0-9+.-]*:/i.test(resolved)
}

/**
 * Pure HTML rewrite helper: for each `<img src="...">`, resolve local/relative paths
 * and pass absolute local paths through `toAssetUrl` (e.g. Tauri `convertFileSrc`).
 * Remote/data URLs are left unchanged.
 *
 * Absolute paths are rewritten even when `documentPath` is missing.
 * Relative paths require `documentPath` to resolve.
 */
export function rewriteHtmlImageSrcs(
  html: string,
  documentPath: string | null | undefined,
  toAssetUrl: (absolutePath: string) => string,
): string {
  if (!html)
    return html

  return html.replace(
    /(<img\b[^>]+?\bsrc=["'])([^"']+)(["'])/gi,
    (full, prefix: string, src: string, suffix: string) => {
      const trimmed = src.trim()
      if (!trimmed || isRemoteOrDataImageSrc(trimmed))
        return full

      // Absolute path: convert regardless of document path
      if (isAbsoluteLocalPath(trimmed)) {
        try {
          return `${prefix}${toAssetUrl(normalizeDocumentPath(trimmed))}${suffix}`
        }
        catch {
          return full
        }
      }

      if (!documentPath)
        return full

      const resolved = resolveImagePath(documentPath, trimmed)
      if (!resolved || !needsAssetConversion(resolved))
        return full
      try {
        const asset = toAssetUrl(resolved)
        return `${prefix}${asset}${suffix}`
      }
      catch {
        return full
      }
    },
  )
}
