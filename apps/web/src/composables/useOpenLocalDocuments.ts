import { isTauriRuntime, normalizeDocumentPath, readTextFile } from '@md/desktop-fs'
import { t } from '@/i18n/translate'
import {
  getTauriDialogDefaultPath,
  setLastOpenDirectory,
} from '@/lib/documents/last-open-directory'
import { usePostStore } from '@/stores/post'

/** Prefer real filesystem path (desktop shell); fall back to name in the browser. */
function resolveFilePath(file: File, used: Set<string>): string {
  const withPath = file as File & { path?: string }
  let path = withPath.path
    || (file.webkitRelativePath && file.webkitRelativePath.length > 0 ? file.webkitRelativePath : ``)
    || file.name

  if (!path)
    path = `untitled.md`

  if (!used.has(path))
    return path

  // Disambiguate same-name picks in one multi-select so they don't overwrite each other.
  const dot = path.lastIndexOf(`.`)
  const stem = dot > 0 ? path.slice(0, dot) : path
  const ext = dot > 0 ? path.slice(dot) : ``
  let i = 2
  let candidate = `${stem} (${i})${ext}`
  while (used.has(candidate)) {
    i += 1
    candidate = `${stem} (${i})${ext}`
  }
  return candidate
}

async function openWithTauriDialog(postStore: ReturnType<typeof usePostStore>): Promise<void> {
  const { open } = await import(`@tauri-apps/plugin-dialog`)
  const defaultPath = await getTauriDialogDefaultPath()
  const selected = await open({
    multiple: true,
    defaultPath,
    filters: [{ name: `Markdown`, extensions: [`md`, `markdown`, `txt`] }],
  })
  if (!selected)
    return

  const paths = (Array.isArray(selected) ? selected : [selected])
    .map(p => normalizeDocumentPath(p))
    .filter(Boolean)

  if (!paths.length)
    return

  await setLastOpenDirectory(paths[0])

  const { opened } = await postStore.openDocumentsFromPaths(
    paths,
    path => readTextFile(path),
  )

  if (opened > 0)
    toast.success(t(`store.post.openedFiles`, { count: opened }))
}

function openWithHtmlInput(postStore: ReturnType<typeof usePostStore>): Promise<void> {
  return new Promise((resolve) => {
    const input = document.createElement(`input`)
    input.type = `file`
    input.multiple = true
    input.accept = `.md,.markdown,.txt,text/markdown,text/plain`

    let settled = false
    const finish = () => {
      if (settled)
        return
      settled = true
      resolve()
    }

    input.addEventListener(`cancel`, finish)
    input.onchange = async () => {
      const files = Array.from(input.files ?? [])
      if (!files.length) {
        finish()
        return
      }

      try {
        const used = new Set<string>()
        const contents = new Map<string, string>()
        const paths: string[] = []

        for (const file of files) {
          const path = resolveFilePath(file, used)
          used.add(path)
          paths.push(path)
          contents.set(path, await file.text())
          const filePath = (file as File & { path?: string }).path
          if (filePath)
            await setLastOpenDirectory(filePath)
        }

        const { opened } = await postStore.openDocumentsFromPaths(
          paths,
          async path => contents.get(path) ?? ``,
        )

        if (opened > 0)
          toast.success(t(`store.post.openedFiles`, { count: opened }))
      }
      catch (error) {
        console.error(error)
        toast.error(t(`store.post.openFilesFailed`))
      }
      finally {
        finish()
      }
    }

    input.click()
  })
}

/**
 * Open local markdown files.
 * Desktop (Tauri): native dialog starting at last-opened directory.
 * Web: hidden `<input type="file" multiple>` fallback.
 */
export function useOpenLocalDocuments() {
  const postStore = usePostStore()

  async function openLocalDocuments(): Promise<void> {
    try {
      if (isTauriRuntime()) {
        await openWithTauriDialog(postStore)
        return
      }
    }
    catch (error) {
      console.warn(`[open-local] tauri dialog failed, fallback to input`, error)
    }

    try {
      await openWithHtmlInput(postStore)
    }
    catch (error) {
      console.error(error)
      toast.error(t(`store.post.openFilesFailed`))
    }
  }

  return {
    openLocalDocuments,
  }
}
