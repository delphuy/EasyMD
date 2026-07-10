/**
 * Normalize a document filesystem path for stable identity comparison.
 * - null/undefined/blank → empty string
 * - strip `file://` prefix
 * - unify `\` to `/`
 * - `/C:/...` → `C:/...`
 * - uppercase Windows drive letter
 */
export function normalizeDocumentPath(path: string | null | undefined): string {
  if (!path)
    return ``
  let p = path.trim().replace(/^file:\/\//i, ``)
  p = p.replace(/\\/g, `/`)
  // Windows: /C:/... -> C:/...
  if (/^\/[A-Za-z]:\//.test(p))
    p = p.slice(1)
  if (/^[A-Za-z]:\//.test(p))
    p = p[0]!.toUpperCase() + p.slice(1)
  return p
}
