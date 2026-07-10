/**
 * Pure markdown snippets for the editor toolbar.
 * Keep free of Vue / store dependencies so unit tests stay simple.
 */

/** Wrap selected text as inline math: `$...$` */
export function mathSnippet(selected = ``): string {
  const body = selected || `E = mc^2`
  return `$${body}$`
}

/** Wrap selected text as a fenced code block */
export function codeBlockSnippet(selected = ``): string {
  const body = selected || ``
  return `\`\`\`\n${body}\n\`\`\``
}

/** Prefix each line with blockquote marker */
export function blockquoteSnippet(selected = ``): string {
  if (!selected)
    return `> `
  return selected
    .split(`\n`)
    .map(line => (line.startsWith(`> `) ? line : `> ${line}`))
    .join(`\n`)
}

/** Local date string, e.g. 2026-07-09 */
export function dateSnippet(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, `0`)
  const d = String(date.getDate()).padStart(2, `0`)
  return `${y}-${m}-${d}`
}

/** Local time string, e.g. 14:30:05 */
export function timeSnippet(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, `0`)
  const m = String(date.getMinutes()).padStart(2, `0`)
  const s = String(date.getSeconds()).padStart(2, `0`)
  return `${h}:${m}:${s}`
}

/** Mermaid flowchart template */
export function flowchartSnippet(): string {
  return [
    `\`\`\`mermaid`,
    `flowchart TD`,
    `    A[Start] --> B[Process]`,
    `    B --> C{Decision}`,
    `    C -->|Yes| D[Result]`,
    `    C -->|No| E[End]`,
    `\`\`\``,
  ].join(`\n`)
}

/** Mermaid pie chart template */
export function mermaidPieSnippet(): string {
  return [
    `\`\`\`mermaid`,
    `pie`,
    `  title 示例占比`,
    `  "A" : 40`,
    `  "B" : 35`,
    `  "C" : 25`,
    `\`\`\``,
  ].join(`\n`)
}

/** PlantUML sequence template */
export function plantumlSnippet(): string {
  return [
    `\`\`\`plantuml`,
    `@startuml`,
    `Alice -> Bob: Hello`,
    `Bob --> Alice: Hi`,
    `@enduml`,
    `\`\`\``,
  ].join(`\n`)
}

/** Infographic template */
export function infographicSnippet(): string {
  return [
    `\`\`\`infographic`,
    `infographic list-row-horizontal-icon-arrow`,
    `data`,
    `  title 示例流程`,
    `  desc 工具栏插入`,
    `  items`,
    `    - label 写作`,
    `      value 1`,
    `      desc 编辑 Markdown`,
    `      icon rocket-launch`,
    `    - label 预览`,
    `      value 2`,
    `      desc PC / Mobile`,
    `      icon progress-check`,
    `    - label 导出`,
    `      value 3`,
    `      desc 多格式导出`,
    `      icon account-sync`,
    `\`\`\``,
  ].join(`\n`)
}

/** TOC marker */
export function tocSnippet(): string {
  return `[TOC]`
}

/** Horizontal rule */
export function hrSnippet(): string {
  return `\n---\n`
}

/** Block math */
export function blockMathSnippet(selected = ``): string {
  const body = selected || `a^2 + b^2 = c^2`
  return `$$\n${body}\n$$`
}

/** Ruby annotation [text]{reading} */
export function rubySnippet(selected = ``): string {
  const text = selected || `文字`
  return `[${text}]{注音}`
}

/** GFM alert / admonition */
export function alertSnippet(type: `NOTE` | `TIP` | `WARNING` | `IMPORTANT` = `NOTE`): string {
  return [
    `> [!${type}]`,
    `> 在此填写内容`,
  ].join(`\n`)
}

/** Highlight ==text== */
export function wrapHighlight(selected = ``): string {
  const body = selected || `高亮`
  return `==${body}==`
}

/** Underline ++text++ */
export function wrapUnderline(selected = ``): string {
  const body = selected || `下划线`
  return `++${body}++`
}
