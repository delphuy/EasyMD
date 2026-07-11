import { describe, expect, it } from 'vitest'
import { LOCAL_SAFE_URI_REGEXP, sanitizeHtml } from './markdownHelpers'

describe(`sanitizeHtml local image paths`, () => {
  it(`keeps Windows absolute image src`, () => {
    const src = `C:/Users/youdh/Documents/Codex/a.png`
    const html = `<figure><img src="${src}" alt="x"/></figure>`
    const out = sanitizeHtml(html)
    expect(out).toContain(`src="${src}"`)
  })

  it(`keeps relative image src`, () => {
    const html = `<img src="./images/a.png" alt="x"/>`
    expect(sanitizeHtml(html)).toContain(`src="./images/a.png"`)
  })

  it(`keeps asset protocol after convertFileSrc`, () => {
    const html = `<img src="asset://localhost/C%3A/a.png" alt="x"/>`
    expect(sanitizeHtml(html)).toContain(`src="asset://localhost`)
  })

  it(`strips javascript: urls`, () => {
    const out = sanitizeHtml(`<img src="javascript:alert(1)" alt="x"/>`)
    expect(out).not.toContain(`javascript:`)
  })

  it(`keeps referrerpolicy for remote image anti-hotlink`, () => {
    const html = `<figure><img src="https://gitee.com/user/repo/raw/main/a.png" alt="x" referrerpolicy="no-referrer"/></figure>`
    const out = sanitizeHtml(html)
    expect(out).toContain(`src="https://gitee.com/user/repo/raw/main/a.png"`)
    expect(out).toContain(`referrerpolicy="no-referrer"`)
  })

  it(`lOCAL_SAFE_URI_REGEXP matches drive paths`, () => {
    expect(LOCAL_SAFE_URI_REGEXP.test(`C:/Users/a.png`)).toBe(true)
    expect(LOCAL_SAFE_URI_REGEXP.test(`./a.png`)).toBe(true)
    expect(LOCAL_SAFE_URI_REGEXP.test(`https://gitee.com/a.png`)).toBe(true)
    expect(LOCAL_SAFE_URI_REGEXP.test(`javascript:alert(1)`)).toBe(false)
  })
})
