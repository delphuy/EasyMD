import { describe, expect, it } from 'vitest'
import { getFileSystemPath, setFileSystemPath } from '@/lib/documents/file-path-map'
import { normalizeImageFile, validateImageFile } from './validate-image'

const t = (key: string) => key

function makeFile(name: string, type: string, size = 100) {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe(`validateImageFile`, () => {
  it(`accepts png by extension`, () => {
    const r = validateImageFile(makeFile(`a.png`, `image/png`), t)
    expect(r.ok).toBe(true)
    if (r.ok)
      expect(r.file.name).toBe(`a.png`)
  })

  it(`accepts clipboard image without extension via mime`, () => {
    const r = validateImageFile(makeFile(``, `image/png`), t)
    expect(r.ok).toBe(true)
    if (r.ok)
      expect(r.file.name).toMatch(/\.png$/)
  })

  it(`accepts image.png from screenshot paste`, () => {
    const r = validateImageFile(makeFile(`image.png`, `image/png`), t)
    expect(r.ok).toBe(true)
  })

  it(`rejects non-image types`, () => {
    const r = validateImageFile(makeFile(`a.txt`, `text/plain`), t)
    expect(r.ok).toBe(false)
  })

  it(`normalizeImageFile keeps valid names`, () => {
    const f = makeFile(`photo.JPG`, `image/jpeg`)
    expect(normalizeImageFile(f).name).toBe(`photo.JPG`)
  })

  it(`preserves filesystem path when reconstructing clipboard file`, () => {
    const f = makeFile(`image`, `image/png`)
    setFileSystemPath(f, `D:/pics/shot.png`)
    const r = validateImageFile(f, t)
    expect(r.ok).toBe(true)
    if (r.ok)
      expect(getFileSystemPath(r.file)).toBe(`D:/pics/shot.png`)
  })
})
