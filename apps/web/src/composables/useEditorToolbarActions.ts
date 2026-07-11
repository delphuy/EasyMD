import type { EditorView } from '@codemirror/view'
import {
  applyHeading,
  formatBold,
  formatCode,
  formatItalic,
  formatLink,
  formatOrderedList,
  formatStrikethrough,
  formatUnorderedList,
  redoAction,
  undoAction,
} from '@md/shared/editor'
import { useDocumentSave } from '@/composables/useDocumentSave'
import {
  alertSnippet,
  blockMathSnippet,
  blockquoteSnippet,
  codeBlockSnippet,
  dateSnippet,
  flowchartSnippet,
  hrSnippet,
  infographicSnippet,
  mathSnippet,
  mermaidPieSnippet,
  plantumlSnippet,
  rubySnippet,
  timeSnippet,
  tocSnippet,
  wrapHighlight,
  wrapUnderline,
} from '@/lib/editor/toolbar-snippets'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'

/**
 * Toolbar actions for the markdown editor.
 * Uses CM6 helpers from @md/shared/editor + pure snippets.
 */
export function useEditorToolbarActions() {
  const editorStore = useEditorStore()
  const uiStore = useUIStore()
  const { saveCurrentDocument } = useDocumentSave()

  function getView(): EditorView | null {
    return editorStore.editor ? (toRaw(editorStore.editor) as EditorView) : null
  }

  function withView(fn: (view: EditorView) => void) {
    const view = getView()
    if (!view)
      return
    fn(view)
    view.focus()
  }

  function insertSnippet(text: string, cursorOffset?: number) {
    withView((view) => {
      const selection = view.state.selection.main
      const from = selection.from
      const to = selection.to
      const offset = cursorOffset ?? text.length
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + offset },
      })
    })
  }

  function replaceSelectionWith(text: string, cursorOffset?: number) {
    withView((view) => {
      const selection = view.state.selection.main
      const from = selection.from
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: from + (cursorOffset ?? text.length) },
      })
    })
  }

  // --- Format ---
  function bold() {
    withView(formatBold)
  }

  function italic() {
    withView(formatItalic)
  }

  function strikethrough() {
    withView(formatStrikethrough)
  }

  function heading(level: 1 | 2 | 3 | 4) {
    withView(view => applyHeading(view, level))
  }

  function highlight() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = wrapHighlight(selected)
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: selected
          ? { anchor: selection.from + text.length }
          : { anchor: selection.from + 2, head: selection.from + text.length - 2 },
      })
    })
  }

  function underline() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = wrapUnderline(selected)
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: selected
          ? { anchor: selection.from + text.length }
          : { anchor: selection.from + 2, head: selection.from + text.length - 2 },
      })
    })
  }

  function orderedList() {
    withView(formatOrderedList)
  }

  function unorderedList() {
    withView(formatUnorderedList)
  }

  function inlineCode() {
    withView(formatCode)
  }

  function link() {
    withView(formatLink)
  }

  // --- Insert snippets / dialogs ---
  function blockquote() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = blockquoteSnippet(selected)
      // Place cursor after `> ` when inserting empty quote
      const cursorOffset = selected ? text.length : 2
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + cursorOffset },
      })
    })
  }

  function codeBlock() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = codeBlockSnippet(selected)
      // Cursor inside fence when empty
      const cursorOffset = selected ? text.length : 4
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + cursorOffset },
      })
    })
  }

  function image() {
    // 与菜单「插入 → 图片」一致：打开图床面板（支持本地插入 + 各云图床）
    uiStore.toggleShowUploadImgDialog(true)
  }

  function table() {
    uiStore.toggleShowInsertFormDialog(true)
  }

  function formula() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = mathSnippet(selected)
      // Place cursor between $ $ when empty default body is used and selection empty —
      // when selected is empty we insert default formula fully selected-friendly; keep end cursor.
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: selected
          ? { anchor: selection.from + text.length }
          : { anchor: selection.from + 1, head: selection.from + text.length - 1 },
      })
    })
  }

  function flowchart() {
    insertSnippet(`\n${flowchartSnippet()}\n`)
  }

  function mermaidPie() {
    insertSnippet(`\n${mermaidPieSnippet()}\n`)
  }

  function plantuml() {
    insertSnippet(`\n${plantumlSnippet()}\n`)
  }

  function infographic() {
    insertSnippet(`\n${infographicSnippet()}\n`)
  }

  function toc() {
    insertSnippet(`\n${tocSnippet()}\n`)
  }

  function hr() {
    insertSnippet(hrSnippet())
  }

  function blockMath() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = `\n${blockMathSnippet(selected)}\n`
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + text.length },
      })
    })
  }

  function ruby() {
    withView((view) => {
      const selection = view.state.selection.main
      const selected = view.state.doc.sliceString(selection.from, selection.to)
      const text = rubySnippet(selected)
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: selected
          ? { anchor: selection.from + text.length }
          : { anchor: selection.from + 1, head: selection.from + 3 },
      })
    })
  }

  function alert(type: `NOTE` | `TIP` | `WARNING` | `IMPORTANT` = `NOTE`) {
    insertSnippet(`\n${alertSnippet(type)}\n`)
  }

  function insertDate() {
    insertSnippet(dateSnippet())
  }

  function insertTime() {
    insertSnippet(timeSnippet())
  }

  // --- History ---
  function undo() {
    withView((view) => {
      try {
        undoAction(view)
      }
      catch (error) {
        console.error(`Undo failed:`, error)
      }
    })
  }

  function redo() {
    withView((view) => {
      try {
        redoAction(view)
      }
      catch (error) {
        console.error(`Redo failed:`, error)
      }
    })
  }

  /** Save current document to disk (desktop) or download / File System Access (web). */
  function save() {
    void saveCurrentDocument(`save`)
  }

  function saveAs() {
    void saveCurrentDocument(`saveAs`)
  }

  return {
    bold,
    italic,
    strikethrough,
    highlight,
    underline,
    heading,
    orderedList,
    unorderedList,
    inlineCode,
    link,
    blockquote,
    codeBlock,
    image,
    table,
    formula,
    blockMath,
    flowchart,
    mermaidPie,
    plantuml,
    infographic,
    toc,
    hr,
    ruby,
    alert,
    insertDate,
    insertTime,
    undo,
    redo,
    save,
    saveAs,
    // exposed for tests / advanced callers
    insertSnippet,
    replaceSelectionWith,
  }
}
