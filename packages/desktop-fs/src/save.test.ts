import { describe, expect, it, vi } from 'vitest'
import { saveMarkdownDocument, type SaveDeps } from './save'

function createMemoryFs(initial: Record<string, string> = {}): SaveDeps & {
  files: Map<string, string>
} {
  const files = new Map(Object.entries(initial))
  return {
    files,
    async writeTextFile(path, content) {
      files.set(path, content)
    },
    async readTextFile(path) {
      if (!files.has(path))
        throw new Error(`ENOENT: ${path}`)
      return files.get(path)!
    },
    async remove(path) {
      files.delete(path)
    },
  }
}

describe(`saveMarkdownDocument`, () => {
  it(`saves to existing path via temp verify then target write`, async () => {
    const deps = createMemoryFs()
    const writeSpy = vi.spyOn(deps, `writeTextFile`)
    const result = await saveMarkdownDocument(deps, {
      content: `# Hello`,
      path: `C:/docs/a.md`,
    })

    expect(result).toEqual({ status: `saved`, path: `C:/docs/a.md` })
    expect(deps.files.get(`C:/docs/a.md`)).toBe(`# Hello`)
    // temp file cleaned up
    for (const key of deps.files.keys())
      expect(key).not.toContain(`.easymd.tmp.`)
    // wrote temp then target
    expect(writeSpy).toHaveBeenCalledTimes(2)
    expect(writeSpy.mock.calls[0][0]).toMatch(/\.easymd\.tmp\.\d+$/)
    expect(writeSpy.mock.calls[1][0]).toBe(`C:/docs/a.md`)
  })

  it(`opens dialog when path is missing`, async () => {
    const deps = createMemoryFs()
    deps.showSaveDialog = async (defaultName) => {
      expect(defaultName).toBe(`untitled.md`)
      return `C:/picked/note.md`
    }
    const result = await saveMarkdownDocument(deps, {
      content: `body`,
      path: null,
    })
    expect(result).toEqual({ status: `saved`, path: `C:/picked/note.md` })
    expect(deps.files.get(`C:/picked/note.md`)).toBe(`body`)
  })

  it(`uses defaultName in dialog`, async () => {
    const deps = createMemoryFs()
    deps.showSaveDialog = async (defaultName) => {
      expect(defaultName).toBe(`my-title.md`)
      return `C:/my-title.md`
    }
    await saveMarkdownDocument(deps, {
      content: `x`,
      defaultName: `my-title.md`,
    })
  })

  it(`returns cancelled when dialog is dismissed`, async () => {
    const deps = createMemoryFs()
    deps.showSaveDialog = async () => null
    const result = await saveMarkdownDocument(deps, {
      content: `x`,
      path: null,
    })
    expect(result).toEqual({ status: `cancelled` })
    expect(deps.files.size).toBe(0)
  })

  it(`fails when no path and no dialog`, async () => {
    const deps = createMemoryFs()
    const result = await saveMarkdownDocument(deps, {
      content: `x`,
      path: ``,
    })
    expect(result.status).toBe(`failed`)
    expect(result.error).toMatch(/No path/i)
  })

  it(`returns failed and does not pretend success when write throws`, async () => {
    const deps = createMemoryFs()
    deps.writeTextFile = async () => {
      throw new Error(`disk full`)
    }
    const result = await saveMarkdownDocument(deps, {
      content: `x`,
      path: `C:/a.md`,
    })
    expect(result).toEqual({ status: `failed`, error: `disk full` })
  })

  it(`returns failed when verification mismatches`, async () => {
    const deps = createMemoryFs()
    deps.writeTextFile = async (path, content) => {
      // corrupt only temp write
      if (path.includes(`.easymd.tmp.`))
        deps.files.set(path, `${content}!`)
      else
        deps.files.set(path, content)
    }
    const result = await saveMarkdownDocument(deps, {
      content: `expected`,
      path: `C:/a.md`,
    })
    expect(result.status).toBe(`failed`)
    expect(result.error).toMatch(/verification/i)
    expect(deps.files.has(`C:/a.md`)).toBe(false)
  })

  it(`cleans up temp file after failure`, async () => {
    const deps = createMemoryFs()
    let writes = 0
    deps.writeTextFile = async (path, content) => {
      writes++
      if (writes === 1) {
        deps.files.set(path, content)
        return
      }
      throw new Error(`target write failed`)
    }
    const result = await saveMarkdownDocument(deps, {
      content: `payload`,
      path: `C:/a.md`,
    })
    expect(result.status).toBe(`failed`)
    for (const key of deps.files.keys())
      expect(key).not.toContain(`.easymd.tmp.`)
  })

  it(`normalizes path from options and dialog`, async () => {
    const deps = createMemoryFs()
    const result = await saveMarkdownDocument(deps, {
      content: `z`,
      path: `c:\\work\\z.md`,
    })
    expect(result).toEqual({ status: `saved`, path: `C:/work/z.md` })
    expect(deps.files.get(`C:/work/z.md`)).toBe(`z`)
  })
})
