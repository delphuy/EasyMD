import { describe, expect, it } from 'vitest'
import {
  alertSnippet,
  blockquoteSnippet,
  codeBlockSnippet,
  dateSnippet,
  flowchartSnippet,
  mathSnippet,
  plantumlSnippet,
  timeSnippet,
  tocSnippet,
  wrapHighlight,
} from './toolbar-snippets'

describe(`mathSnippet`, () => {
  it(`wraps selection with $`, () => {
    expect(mathSnippet(`x^2`)).toBe(`$x^2$`)
  })

  it(`uses a default body when selection is empty`, () => {
    expect(mathSnippet()).toBe(`$E = mc^2$`)
    expect(mathSnippet(``)).toBe(`$E = mc^2$`)
  })
})

describe(`flowchartSnippet`, () => {
  it(`returns a mermaid flowchart template`, () => {
    const snip = flowchartSnippet()
    expect(snip).toContain(`\`\`\`mermaid`)
    expect(snip).toContain(`flowchart TD`)
    expect(snip.trimEnd().endsWith(`\`\`\``)).toBe(true)
  })
})

describe(`codeBlockSnippet`, () => {
  it(`wraps selection in a fenced code block`, () => {
    expect(codeBlockSnippet(`const a = 1`)).toBe(`\`\`\`\nconst a = 1\n\`\`\``)
  })

  it(`creates an empty fence when selection is empty`, () => {
    expect(codeBlockSnippet()).toBe(`\`\`\`\n\n\`\`\``)
  })
})

describe(`blockquoteSnippet`, () => {
  it(`returns quote prefix when empty`, () => {
    expect(blockquoteSnippet()).toBe(`> `)
  })

  it(`prefixes each line`, () => {
    expect(blockquoteSnippet(`a\nb`)).toBe(`> a\n> b`)
  })

  it(`does not double-prefix already quoted lines`, () => {
    expect(blockquoteSnippet(`> a\nb`)).toBe(`> a\n> b`)
  })
})

describe(`dateSnippet / timeSnippet`, () => {
  it(`formats local date as YYYY-MM-DD`, () => {
    const date = new Date(2026, 6, 9, 14, 30, 5)
    expect(dateSnippet(date)).toBe(`2026-07-09`)
  })

  it(`formats local time as HH:mm:ss`, () => {
    const date = new Date(2026, 6, 9, 14, 30, 5)
    expect(timeSnippet(date)).toBe(`14:30:05`)
  })
})

describe(`extended snippets`, () => {
  it(`builds plantuml fence`, () => {
    expect(plantumlSnippet()).toContain(`@startuml`)
  })
  it(`builds toc marker`, () => {
    expect(tocSnippet()).toBe(`[TOC]`)
  })
  it(`builds alert`, () => {
    expect(alertSnippet(`TIP`)).toContain(`[!TIP]`)
  })
  it(`wraps highlight`, () => {
    expect(wrapHighlight(`x`)).toBe(`==x==`)
  })
})
