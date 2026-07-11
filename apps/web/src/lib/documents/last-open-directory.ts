import { dirnameOfDocument, isTauriRuntime, normalizeDocumentPath } from '@md/desktop-fs'
import { store } from '@/storage'

const STORAGE_KEY = `lastOpenDirectory`

/** In-memory handle for File System Access API (cannot serialize). */
let lastDirectoryHandle: FileSystemDirectoryHandle | null = null

/** Sync read of last directory path (after storage preload). */
export function getLastOpenDirectory(): string {
  return normalizeDocumentPath(store.getSync(STORAGE_KEY) || ``)
}

export async function readLastOpenDirectory(): Promise<string> {
  const raw = await store.get(STORAGE_KEY)
  return normalizeDocumentPath(typeof raw === `string` ? raw : ``)
}

/**
 * Remember last directory. Accepts a file path or directory path.
 */
export async function setLastOpenDirectory(pathOrDir: string | null | undefined): Promise<void> {
  const normalized = normalizeDocumentPath(pathOrDir)
  if (!normalized)
    return
  // If a file path was given, keep its parent directory
  const looksLikeFile = /\.[a-z0-9]{1,8}$/i.test(normalized.split(`/`).pop() || ``)
  const dir = looksLikeFile ? dirnameOfDocument(normalized) : normalized
  if (!dir)
    return
  await store.set(STORAGE_KEY, dir)
}

export function getLastDirectoryHandle(): FileSystemDirectoryHandle | null {
  return lastDirectoryHandle
}

export function setLastDirectoryHandle(handle: FileSystemDirectoryHandle | null): void {
  lastDirectoryHandle = handle
}

/**
 * Start location for showDirectoryPicker / showOpenFilePicker.
 * Prefers last handle; otherwise falls back to documents well-known dir.
 */
export function getDirectoryPickerStartIn(): FileSystemDirectoryHandle | 'desktop' | 'documents' | 'downloads' | 'pictures' {
  if (lastDirectoryHandle)
    return lastDirectoryHandle
  return `documents`
}

/**
 * Default path for Tauri dialog plugins.
 */
export async function getTauriDialogDefaultPath(): Promise<string | undefined> {
  if (!isTauriRuntime())
    return undefined
  const last = await readLastOpenDirectory()
  return last || undefined
}
