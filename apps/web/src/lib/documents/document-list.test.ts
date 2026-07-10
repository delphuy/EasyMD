import { describe, expect, it } from 'vitest'
import {
  applyDocToPost,
  openDocumentsFromPathsCore,
  postToDoc,
  titleFromPath,
} from './document-list'
import type { Post } from '@/types/post'

function samplePost(overrides: Partial<Post> = {}): Post {
  return {
    id: `id-1`,
    title: `draft`,
    content: `hello`,
    history: [],
    createDatetime: new Date(`2020-01-01T00:00:00.000Z`),
    updateDatetime: new Date(`2020-01-01T00:00:00.000Z`),
    path: null,
    dirty: false,
    ...overrides,
  }
}

describe(`titleFromPath`, () => {
  it(`strips directory and extension`, () => {
    expect(titleFromPath(`C:/notes/readme.md`)).toBe(`readme`)
    expect(titleFromPath(`notes\\guide.markdown`)).toBe(`guide`)
    expect(titleFromPath(`plain.txt`)).toBe(`plain`)
  })
})

describe(`postToDoc / applyDocToPost`, () => {
  it(`round-trips path and dirty`, () => {
    const post = samplePost({ path: `C:/a.md`, dirty: true, title: `a` })
    const doc = postToDoc(post)
    expect(doc.path).toBe(`C:/a.md`)
    expect(doc.dirty).toBe(true)
    const back = applyDocToPost(doc, post)
    expect(back.path).toBe(`C:/a.md`)
    expect(back.dirty).toBe(true)
    expect(back.history).toBe(post.history)
  })
})

describe(`openDocumentsFromPathsCore`, () => {
  it(`adds multiple distinct paths without overwriting`, async () => {
    const files = new Map([
      [`C:/a.md`, `# A`],
      [`C:/b.md`, `# B`],
    ])
    const { posts, lastIndex, opened } = await openDocumentsFromPathsCore(
      [],
      [`C:/a.md`, `C:/b.md`],
      async p => files.get(p)!,
    )
    expect(opened).toBe(2)
    expect(posts).toHaveLength(2)
    expect(posts[0].content).toBe(`# A`)
    expect(posts[1].content).toBe(`# B`)
    expect(posts[0].path).toBe(`C:/a.md`)
    expect(posts[1].path).toBe(`C:/b.md`)
    expect(posts[0].dirty).toBe(false)
    expect(lastIndex).toBe(1)
  })

  it(`dedupes same path (including normalization) and updates content`, async () => {
    const existing = samplePost({
      id: `keep-me`,
      title: `a`,
      content: `old`,
      path: `C:/notes/a.md`,
      dirty: true,
      history: [{ datetime: `2020`, content: `old` }],
    })
    const { posts, lastIndex, opened } = await openDocumentsFromPathsCore(
      [existing],
      [`c:\\notes\\a.md`],
      async () => `new content`,
    )
    expect(opened).toBe(1)
    expect(posts).toHaveLength(1)
    expect(lastIndex).toBe(0)
    expect(posts[0].id).toBe(`keep-me`)
    expect(posts[0].content).toBe(`new content`)
    expect(posts[0].path).toBe(`C:/notes/a.md`)
    expect(posts[0].dirty).toBe(false)
    expect(posts[0].history).toEqual(existing.history)
  })

  it(`does not mutate original posts array`, async () => {
    const original = [samplePost({ path: `C:/a.md`, content: `1` })]
    const snapshot = original.map(p => ({ ...p }))
    await openDocumentsFromPathsCore(
      original,
      [`C:/b.md`],
      async () => `2`,
    )
    expect(original).toHaveLength(1)
    expect(original[0].content).toBe(snapshot[0].content)
  })

  it(`returns empty result for empty paths`, async () => {
    const original = [samplePost()]
    const result = await openDocumentsFromPathsCore(original, [], async () => ``)
    expect(result.posts).toBe(original)
    expect(result.opened).toBe(0)
    expect(result.lastIndex).toBe(-1)
  })
})
