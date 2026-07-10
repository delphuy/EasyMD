import { saveMarkdownDocument } from '@md/desktop-fs'
import { sanitizeTitle } from '@md/shared/utils/basicHelpers'
import { t } from '@/i18n/translate'
import { createSaveDeps } from '@/lib/documents/save-deps'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'

export type SaveDocumentMode = `save` | `saveAs`

/**
 * Save / Save As for the current document via @md/desktop-fs.
 * - save: write to existing path, or open dialog when path is missing
 * - saveAs: always open dialog
 */
export function useDocumentSave() {
  const editorStore = useEditorStore()
  const postStore = usePostStore()

  async function saveCurrentDocument(mode: SaveDocumentMode = `save`): Promise<void> {
    editorStore.flushContentToPostStore()

    const post = postStore.currentPost
    if (!post)
      return

    const content = editorStore.getContent() || post.content
    const defaultBase = sanitizeTitle(post.title || `untitled`)
    const defaultName = defaultBase.toLowerCase().endsWith(`.md`)
      ? defaultBase
      : `${defaultBase}.md`

    try {
      const deps = await createSaveDeps()
      const result = await saveMarkdownDocument(deps, {
        content,
        path: mode === `saveAs` ? null : (post.path ?? null),
        defaultName,
      })

      if (result.status === `saved` && result.path) {
        post.path = result.path
        post.dirty = false
        post.updateDatetime = new Date()
        toast.success(t(`store.post.saveSuccess`))
        return
      }

      if (result.status === `failed`) {
        toast.error(t(`store.post.saveFailed`, {
          message: result.error || t(`common.operationFailed`),
        }))
        return
      }

      // cancelled — silent (optional light hint only when saveAs)
    }
    catch (error) {
      console.error(error)
      toast.error(t(`store.post.saveFailed`, {
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  return {
    saveCurrentDocument,
  }
}
