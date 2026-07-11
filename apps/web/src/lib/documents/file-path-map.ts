import { normalizeDocumentPath } from '@md/desktop-fs'

/**
 * File objects recreated by validation/compression lose custom `.path`.
 * Keep a WeakMap so desktop absolute paths survive the pipeline.
 */
const filePathMap = new WeakMap<File, string>()

export function setFileSystemPath(file: File, path: string | null | undefined): void {
  const normalized = normalizeDocumentPath(path)
  if (!normalized)
    return
  filePathMap.set(file, normalized)
  try {
    Object.defineProperty(file, `path`, {
      value: normalized,
      configurable: true,
      enumerable: false,
      writable: false,
    })
  }
  catch {
    // Some runtimes seal File; WeakMap is enough.
  }
}

export function getFileSystemPath(file: File): string {
  const fromMap = filePathMap.get(file)
  if (fromMap)
    return fromMap
  const withPath = file as File & { path?: string }
  return normalizeDocumentPath(withPath.path || ``)
}

/** Copy associated path from source File onto a newly constructed File. */
export function copyFileSystemPath(from: File, to: File): void {
  const path = getFileSystemPath(from)
  if (path)
    setFileSystemPath(to, path)
}
