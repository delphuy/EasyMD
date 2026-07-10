import type { Doc } from '@md/desktop-fs'
import { upsertMarkdownDocument } from '@md/desktop-fs'
import type { Post } from '@/types/post'

/** Derive a display title from a filesystem path (basename without extension). */
export function titleFromPath(path: string): string {
  const normalized = path.replace(/\\/g, `/`)
  const base = normalized.split(`/`).pop() || path
  const withoutExt = base.replace(/\.(md|markdown|txt)$/i, ``)
  return withoutExt || base
}

export function postToDoc(post: Post): Doc {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    path: post.path ?? null,
    dirty: post.dirty ?? false,
    updatedAt: new Date(post.updateDatetime).getTime(),
  }
}

/**
 * Merge a desktop-fs Doc into a Post, preserving non-Doc fields from an existing post when present.
 */
export function applyDocToPost(doc: Doc, existing?: Post): Post {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    path: doc.path,
    dirty: doc.dirty,
    history: existing?.history ?? [],
    createDatetime: existing?.createDatetime ?? new Date(doc.updatedAt),
    updateDatetime: new Date(doc.updatedAt),
    parentId: existing?.parentId ?? null,
    collapsed: existing?.collapsed,
  }
}

export interface OpenDocumentsFromPathsResult {
  posts: Post[]
  lastIndex: number
  opened: number
}

/**
 * Batch upsert markdown documents by path.
 * Reads all files first (via readFile), then applies upserts and returns the next list once.
 * Same normalized path updates in place; different paths never overwrite each other.
 */
export async function openDocumentsFromPathsCore(
  posts: Post[],
  paths: string[],
  readFile: (path: string) => Promise<string>,
): Promise<OpenDocumentsFromPathsResult> {
  if (paths.length === 0)
    return { posts, lastIndex: -1, opened: 0 }

  // Read all files before mutating the list so a mid-batch failure leaves posts untouched.
  const payloads = await Promise.all(
    paths.map(async (path) => {
      const content = await readFile(path)
      return { path, content, title: titleFromPath(path) }
    }),
  )

  let docs = posts.map(postToDoc)
  const byId = new Map(posts.map(p => [p.id, p]))
  let lastIndex = -1

  for (const { path, content, title } of payloads) {
    const result = upsertMarkdownDocument(docs, { path, content, title })
    docs = result.docs
    lastIndex = result.index
  }

  const nextPosts = docs.map(doc => applyDocToPost(doc, byId.get(doc.id)))
  return { posts: nextPosts, lastIndex, opened: payloads.length }
}
