import { describe, expect, it } from 'vitest'
import { normalizeDocumentPath } from './path'

describe(`normalizeDocumentPath`, () => {
  it(`unifies slashes and normalizes drive on windows style`, () => {
    expect(normalizeDocumentPath(`C:\\a\\b.md`)).toBe(`C:/a/b.md`)
  })

  it(`uppercases drive letter`, () => {
    expect(normalizeDocumentPath(`c:/notes/readme.md`)).toBe(`C:/notes/readme.md`)
  })

  it(`trims file URL prefix`, () => {
    expect(normalizeDocumentPath(`file:///C:/a/b.md`)).toMatch(/C:/)
    expect(normalizeDocumentPath(`file:///C:/a/b.md`)).toBe(`C:/a/b.md`)
  })

  it(`strips leading slash before Windows drive`, () => {
    expect(normalizeDocumentPath(`/C:/docs/x.md`)).toBe(`C:/docs/x.md`)
  })

  it(`trims surrounding whitespace`, () => {
    expect(normalizeDocumentPath(`  D:\\work\\a.md  `)).toBe(`D:/work/a.md`)
  })

  it(`empty becomes empty`, () => {
    expect(normalizeDocumentPath(``)).toBe(``)
  })

  it(`null and undefined become empty`, () => {
    expect(normalizeDocumentPath(null)).toBe(``)
    expect(normalizeDocumentPath(undefined)).toBe(``)
  })

  it(`keeps posix paths`, () => {
    expect(normalizeDocumentPath(`/home/user/a.md`)).toBe(`/home/user/a.md`)
  })
})
