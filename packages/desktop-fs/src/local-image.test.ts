import { describe, expect, it } from 'vitest'
import {
  dirnameOfDocument,
  isAbsoluteLocalPath,
  isRelativeImagePath,
  isRemoteOrDataImageSrc,
  joinPath,
  needsAssetConversion,
  resolveImagePath,
  rewriteHtmlImageSrcs,
  toRelativeImageSrc,
} from './local-image'

describe(`isRemoteOrDataImageSrc`, () => {
  it(`detects http(s), data, blob, asset schemes`, () => {
    expect(isRemoteOrDataImageSrc(`https://cdn.example/a.png`)).toBe(true)
    expect(isRemoteOrDataImageSrc(`http://x/y.jpg`)).toBe(true)
    expect(isRemoteOrDataImageSrc(`data:image/png;base64,abc`)).toBe(true)
    expect(isRemoteOrDataImageSrc(`blob:http://localhost/1`)).toBe(true)
    expect(isRemoteOrDataImageSrc(`asset://localhost/C:/a.png`)).toBe(true)
  })

  it(`rejects local paths`, () => {
    expect(isRemoteOrDataImageSrc(`./img.png`)).toBe(false)
    expect(isRemoteOrDataImageSrc(`C:/docs/a.png`)).toBe(false)
  })
})

describe(`isAbsoluteLocalPath / isRelativeImagePath`, () => {
  it(`classifies windows and posix absolute paths`, () => {
    expect(isAbsoluteLocalPath(`C:\\docs\\a.png`)).toBe(true)
    expect(isAbsoluteLocalPath(`/home/u/a.png`)).toBe(true)
    expect(isAbsoluteLocalPath(`file:///C:/a.png`)).toBe(true)
  })

  it(`classifies relative paths`, () => {
    expect(isRelativeImagePath(`images/a.png`)).toBe(true)
    expect(isRelativeImagePath(`./img.png`)).toBe(true)
    expect(isRelativeImagePath(`../img.png`)).toBe(true)
    expect(isRelativeImagePath(`https://x/a.png`)).toBe(false)
    expect(isRelativeImagePath(`C:/a.png`)).toBe(false)
  })
})

describe(`dirnameOfDocument / joinPath`, () => {
  it(`returns parent directory`, () => {
    expect(dirnameOfDocument(`C:/notes/post.md`)).toBe(`C:/notes`)
    expect(dirnameOfDocument(`/home/u/a.md`)).toBe(`/home/u`)
  })

  it(`joins relative segments and resolves ..`, () => {
    expect(joinPath(`C:/notes`, `images/a.png`)).toBe(`C:/notes/images/a.png`)
    expect(joinPath(`C:/notes/sub`, `../img.png`)).toBe(`C:/notes/img.png`)
    expect(joinPath(`/home/u`, `./pic.jpg`)).toBe(`/home/u/pic.jpg`)
  })
})

describe(`toRelativeImageSrc`, () => {
  it(`builds relative path under the same directory tree`, () => {
    expect(toRelativeImageSrc(`C:/notes/post.md`, `C:/notes/images/a.png`))
      .toBe(`./images/a.png`)
    expect(toRelativeImageSrc(`C:/notes/sub/post.md`, `C:/notes/images/a.png`))
      .toBe(`../images/a.png`)
    expect(toRelativeImageSrc(`/home/u/docs/a.md`, `/home/u/docs/pic.png`))
      .toBe(`./pic.png`)
  })

  it(`returns null across different Windows drives`, () => {
    expect(toRelativeImageSrc(`C:/a.md`, `D:/img.png`)).toBeNull()
  })

  it(`returns null without document path`, () => {
    expect(toRelativeImageSrc(null, `C:/img.png`)).toBeNull()
  })
})

describe(`resolveImagePath`, () => {
  it(`returns remote urls unchanged`, () => {
    expect(resolveImagePath(`C:/a.md`, `https://cdn.example/x.png`)).toBe(`https://cdn.example/x.png`)
  })

  it(`normalizes absolute local paths`, () => {
    expect(resolveImagePath(null, `c:\\imgs\\a.png`)).toBe(`C:/imgs/a.png`)
  })

  it(`resolves relative paths against document directory`, () => {
    expect(resolveImagePath(`C:/notes/post.md`, `./images/cover.png`))
      .toBe(`C:/notes/images/cover.png`)
    expect(resolveImagePath(`/home/u/docs/a.md`, `../assets/x.png`))
      .toBe(`/home/u/assets/x.png`)
  })

  it(`returns null for relative without document path`, () => {
    expect(resolveImagePath(null, `images/a.png`)).toBeNull()
    expect(resolveImagePath(``, `./a.png`)).toBeNull()
  })

  it(`returns null for empty src`, () => {
    expect(resolveImagePath(`C:/a.md`, `  `)).toBeNull()
  })
})

describe(`rewriteHtmlImageSrcs`, () => {
  it(`rewrites relative local images via toAssetUrl`, () => {
    const html = `<figure><img src="./img.png" alt="x"/></figure>`
    const out = rewriteHtmlImageSrcs(html, `C:/notes/a.md`, p => `asset://${p}`)
    expect(out).toContain(`asset://C:/notes/img.png`)
  })

  it(`rewrites absolute Windows paths even without document path`, () => {
    const html = `<figure><img src="C:/Users/me/a.png" alt="x"/></figure>`
    const out = rewriteHtmlImageSrcs(html, null, p => `asset://${p}`)
    expect(out).toContain(`asset://C:/Users/me/a.png`)
  })

  it(`leaves remote images alone`, () => {
    const html = `<img src="https://cdn.example/a.png"/>`
    const out = rewriteHtmlImageSrcs(html, `C:/notes/a.md`, p => `asset://${p}`)
    expect(out).toBe(html)
  })

  it(`relative paths no-op without document path`, () => {
    const html = `<img src="./a.png"/>`
    expect(rewriteHtmlImageSrcs(html, null, p => p)).toBe(html)
  })
})

describe(`needsAssetConversion`, () => {
  it(`true for absolute local paths`, () => {
    expect(needsAssetConversion(`C:/a.png`)).toBe(true)
    expect(needsAssetConversion(`/home/a.png`)).toBe(true)
  })

  it(`false for remote`, () => {
    expect(needsAssetConversion(`https://x/a.png`)).toBe(false)
    expect(needsAssetConversion(null)).toBe(false)
  })
})
