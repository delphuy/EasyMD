import { describe, expect, it } from 'vitest'
import { upsertMarkdownDocument, type Doc } from './document-model'

function sampleDoc(overrides: Partial<Doc> = {}): Doc {
  return {
    id: `id-1`,
    title: `a`,
    content: `1`,
    path: `C:/a.md`,
    dirty: false,
    updatedAt: 1,
    ...overrides,
  }
}

describe(`upsertMarkdownDocument`, () => {
  it(`adds new doc by path`, () => {
    const { docs, index, isNew } = upsertMarkdownDocument([], {
      path: `C:/a.md`,
      content: `# A`,
      title: `a`,
    })
    expect(isNew).toBe(true)
    expect(docs).toHaveLength(1)
    expect(index).toBe(0)
    expect(docs[0].path).toBe(`C:/a.md`)
    expect(docs[0].content).toBe(`# A`)
    expect(docs[0].dirty).toBe(false)
    expect(docs[0].id).toBeTruthy()
  })

  it(`dedupes same path and updates content`, () => {
    const first = upsertMarkdownDocument([], { path: `C:/a.md`, content: `1`, title: `a` })
    const second = upsertMarkdownDocument(first.docs, { path: `C:/a.md`, content: `2`, title: `a` })
    expect(second.isNew).toBe(false)
    expect(second.docs).toHaveLength(1)
    expect(second.docs[0].content).toBe(`2`)
    expect(second.index).toBe(0)
  })

  it(`dedupes after path normalization`, () => {
    const first = upsertMarkdownDocument([], {
      path: `C:\\notes\\a.md`,
      content: `old`,
      title: `a`,
    })
    const second = upsertMarkdownDocument(first.docs, {
      path: `c:/notes/a.md`,
      content: `new`,
      title: `a`,
    })
    expect(second.isNew).toBe(false)
    expect(second.docs).toHaveLength(1)
    expect(second.docs[0].content).toBe(`new`)
    expect(second.docs[0].path).toBe(`C:/notes/a.md`)
  })

  it(`uses provided id for new docs`, () => {
    const { docs } = upsertMarkdownDocument([], {
      path: `C:/b.md`,
      content: `x`,
      title: `b`,
      id: `fixed-id`,
    })
    expect(docs[0].id).toBe(`fixed-id`)
  })

  it(`keeps existing title when input title is empty`, () => {
    const first = upsertMarkdownDocument([], {
      path: `C:/a.md`,
      content: `1`,
      title: `original`,
    })
    const second = upsertMarkdownDocument(first.docs, {
      path: `C:/a.md`,
      content: `2`,
      title: ``,
    })
    expect(second.docs[0].title).toBe(`original`)
  })

  it(`always creates new draft when path is null`, () => {
    const first = upsertMarkdownDocument([], {
      path: null,
      content: `draft1`,
      title: `d1`,
    })
    const second = upsertMarkdownDocument(first.docs, {
      path: null,
      content: `draft2`,
      title: `d2`,
    })
    expect(second.isNew).toBe(true)
    expect(second.docs).toHaveLength(2)
    expect(second.docs[0].path).toBeNull()
    expect(second.docs[1].path).toBeNull()
  })

  it(`does not mutate the original docs array`, () => {
    const original = [sampleDoc()]
    const snapshot = original.slice()
    upsertMarkdownDocument(original, { path: `C:/a.md`, content: `2`, title: `a` })
    expect(original).toEqual(snapshot)
    expect(original[0].content).toBe(`1`)
  })
})
