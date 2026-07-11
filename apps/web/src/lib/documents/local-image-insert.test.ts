import { describe, expect, it } from 'vitest'
import { setFileSystemPath } from './file-path-map'
import { formatMarkdownImage, getFileSystemPath } from './local-image-insert'

describe(`getFileSystemPath`, () => {
  it(`reads path property when present`, () => {
    const file = new File([`x`], `a.png`, { type: `image/png` })
    setFileSystemPath(file, `C:\\notes\\a.png`)
    expect(getFileSystemPath(file)).toBe(`C:/notes/a.png`)
  })

  it(`returns empty without path`, () => {
    const file = new File([`x`], `a.png`, { type: `image/png` })
    expect(getFileSystemPath(file)).toBe(``)
  })
})

describe(`formatMarkdownImage`, () => {
  it(`keeps simple relative paths bare`, () => {
    expect(formatMarkdownImage(`./images/a.png`)).toBe(`![](./images/a.png)`)
  })

  it(`wraps absolute windows paths in angle brackets`, () => {
    expect(formatMarkdownImage(`C:/Users/me/a.png`)).toBe(`![](<C:/Users/me/a.png>)`)
  })

  it(`wraps paths with spaces or parentheses`, () => {
    expect(formatMarkdownImage(`./a b.png`)).toBe(`![](<./a b.png>)`)
    expect(formatMarkdownImage(`./foo (1).png`)).toBe(`![](<./foo (1).png>)`)
  })

  it(`does not wrap remote or data urls`, () => {
    expect(formatMarkdownImage(`https://cdn.example/a.png`)).toBe(`![](https://cdn.example/a.png)`)
    const data = `data:image/png;base64,abc`
    expect(formatMarkdownImage(data)).toBe(`![](${data})`)
  })
})
