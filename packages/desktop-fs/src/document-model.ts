import { normalizeDocumentPath } from './path'

export interface Doc {
  id: string
  title: string
  content: string
  path: string | null
  dirty: boolean
  updatedAt: number
}

export interface UpsertMarkdownDocumentInput {
  path: string | null
  content: string
  title: string
  id?: string
}

export interface UpsertMarkdownDocumentResult {
  docs: Doc[]
  index: number
  isNew: boolean
}

/**
 * Insert or update a markdown document by normalized path.
 * Path-less drafts are always treated as new documents.
 */
export function upsertMarkdownDocument(
  docs: Doc[],
  input: UpsertMarkdownDocumentInput,
): UpsertMarkdownDocumentResult {
  const norm = input.path ? normalizeDocumentPath(input.path) : ``
  const existing = norm
    ? docs.findIndex(d => d.path && normalizeDocumentPath(d.path) === norm)
    : -1
  const now = Date.now()
  if (existing >= 0) {
    const next = docs.slice()
    const prev = next[existing]!
    next[existing] = {
      ...prev,
      content: input.content,
      title: input.title || prev.title,
      path: norm,
      updatedAt: now,
      dirty: false,
    }
    return { docs: next, index: existing, isNew: false }
  }
  const doc: Doc = {
    id: input.id ?? crypto.randomUUID(),
    title: input.title,
    content: input.content,
    path: norm || null,
    dirty: false,
    updatedAt: now,
  }
  return { docs: [...docs, doc], index: docs.length, isNew: true }
}
