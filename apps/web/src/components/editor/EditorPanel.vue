<script setup lang="ts">
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { history, markdownSetup, replaceDocumentWithoutHistory, resetEditorHistory, theme } from '@md/shared/editor'
import { toBase64 } from '@md/shared/utils/fileHelpers'
import imageCompression from 'browser-image-compression'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import SlashCommandMenu from '@/components/editor/SlashCommandMenu.vue'
import { SearchTab } from '@/components/ui/search-tab'
import { useDocumentSave } from '@/composables/useDocumentSave'
import { useEditorRefresh } from '@/composables/useEditorRefresh'
import { useImageUploader } from '@/composables/useImageUploader'
import { completeInitialPreviewBoot } from '@/composables/useInitialPreviewBoot'
import { useLocalizedUploadHostOptions } from '@/composables/useLocalizedUploadHosts'
import { useSlashCommand } from '@/composables/useSlashCommand'
import { formatLocalDateTime } from '@/i18n/translate'
import { formatMarkdownImage, resolveLocalImageMarkdownSrc } from '@/lib/documents/local-image-insert'
import { jumpToAdjacentHeading } from '@/lib/markdown/headingNavigation'
import { contentHasMath, loadMathJax, MATHJAX_READY_EVENT } from '@/lib/preview/mathjax'
import { validateImageFile } from '@/lib/upload/validate-image'
import { fileUpload } from '@/services/upload'
import { store } from '@/storage'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { useRenderStore } from '@/stores/render'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'

const { t, locale } = useI18n()
const uploadHostOptions = useLocalizedUploadHostOptions()
const editorStore = useEditorStore()
const postStore = usePostStore()
const renderStore = useRenderStore()
const themeStore = useThemeStore()
const uiStore = useUIStore()
const { upload } = useImageUploader()
const { editorRefresh } = useEditorRefresh()
const { saveCurrentDocument } = useDocumentSave()

const {
  visible: slashVisible,
  position: slashPosition,
  filter: slashFilter,
  activeIndex: slashActiveIndex,
  basicCommands: slashBasicCommands,
  commonCommands: slashCommonCommands,
  editCommands: slashEditCommands,
  styleCommands: slashStyleCommands,
  filteredCommands: slashFilteredCommands,
  closeMenu: closeSlashMenu,
  executeCommand: executeSlashCommand,
  createExtension: createSlashExtension,
} = useSlashCommand()

function onWrapperContextMenuCapture(e: MouseEvent) {
  if (!slashVisible.value)
    return
  e.preventDefault()
  e.stopPropagation()
}

const { editor } = storeToRefs(editorStore)
const { isDark } = storeToRefs(uiStore)
const { posts, currentPostIndex, currentPost } = storeToRefs(postStore)
const {
  enableImageReupload,
  viewMode,
} = storeToRefs(uiStore)

const { toggleShowUploadImgDialog } = uiStore

const codeMirrorView = shallowRef<EditorView | null>(null)
const themeCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const historyCompartment = new Compartment()

function editorPlaceholder() {
  return placeholder(t(`codemirror.contentPlaceholder`))
}
const changeTimer = ref<ReturnType<typeof setTimeout>>()

const editorRef = useTemplateRef<HTMLDivElement>(`editorRef`)
const codeMirrorWrapper = useTemplateRef<HTMLDivElement>(`codeMirrorWrapper`)

const isImgLoading = ref(false)

// Editor refresh is provided by useEditorRefresh()

// --- Search tab integration ---
const searchTabRef = useTemplateRef<InstanceType<typeof SearchTab>>(`searchTabRef`)
const pendingSearchRequest = ref<{ selected: string } | null>(null)

function ensureEditorVisibleForSearch() {
  // 纯预览时编辑区 display:none，查找面板不可见
  if (viewMode.value === `preview`)
    uiStore.setViewMode(`split`)
}

function openSearchWithSelection(view: EditorView) {
  ensureEditorVisibleForSearch()
  const selection = view.state.selection.main
  const selected = view.state.doc.sliceString(selection.from, selection.to).trim()

  if (searchTabRef.value) {
    if (selected) {
      searchTabRef.value.setSearchWord(selected)
    }
    else {
      searchTabRef.value.showSearchTab = true
    }
  }
  else {
    pendingSearchRequest.value = { selected }
  }
}

function openReplaceWithSelection(view: EditorView) {
  ensureEditorVisibleForSearch()
  const selection = view.state.selection.main
  const selected = view.state.doc.sliceString(selection.from, selection.to).trim()

  if (searchTabRef.value) {
    searchTabRef.value.setSearchWithReplace(selected)
  }
  else {
    uiStore.openSearchTab(selected, true)
  }
}

watch(searchTabRef, (newRef) => {
  if (newRef && pendingSearchRequest.value) {
    const { selected } = pendingSearchRequest.value
    if (selected) {
      newRef.setSearchWord(selected)
    }
    else {
      newRef.showSearchTab = true
    }
    pendingSearchRequest.value = null
  }
})

const { searchTabRequest } = storeToRefs(uiStore)
watch(searchTabRequest, (request) => {
  if (request && searchTabRef.value) {
    const { word, showReplace } = request
    if (showReplace) {
      searchTabRef.value.setSearchWithReplace(word)
    }
    else {
      if (word) {
        searchTabRef.value.setSearchWord(word)
      }
      else {
        searchTabRef.value.showSearchTab = true
      }
    }
    uiStore.clearSearchTabRequest()
  }
})

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false
  const tag = target.tagName
  if (tag === `INPUT` || tag === `TEXTAREA` || tag === `SELECT`)
    return true
  return target.isContentEditable
}

function handleGlobalKeydown(e: KeyboardEvent) {
  const editorView = codeMirrorView.value
  if (e.key === `Escape` && searchTabRef.value?.showSearchTab) {
    searchTabRef.value.showSearchTab = false
    e.preventDefault()
    editorView?.focus()
    return
  }

  // 全局快捷键：焦点不在编辑器时仍可用（编辑器内由 CM keymap 处理）
  const mod = e.ctrlKey || e.metaKey
  if (!mod || e.altKey)
    return

  const key = e.key.toLowerCase()
  // 纯预览时编辑器无焦点，F/H 必须走全局；双栏/编辑且聚焦时由 CM keymap 处理
  const inEditor = viewMode.value !== `preview` && !!(editorView && (
    editorView.hasFocus
    || editorView.dom.contains(document.activeElement)
  ))

  // Ctrl+S：全局统一保存，并拦截浏览器“保存网页”
  if (key === `s` && !e.shiftKey) {
    e.preventDefault()
    e.stopPropagation()
    void saveCurrentDocument(`save`)
    return
  }

  // 编辑器已聚焦时 F/H 交给 CodeMirror keymap
  if (inEditor)
    return

  // 在其它可编辑表单控件内不抢占 F/H
  if (isEditableTarget(e.target))
    return

  if (key === `f` && !e.shiftKey) {
    e.preventDefault()
    if (editorView)
      openSearchWithSelection(editorView)
    else
      uiStore.openSearchTab(``, false)
    return
  }

  if (key === `h` && !e.shiftKey) {
    e.preventDefault()
    if (editorView)
      openReplaceWithSelection(editorView)
    else
      uiStore.openSearchTab(``, true)
  }
}

async function handleInsertLocalImagesEvent(event: Event) {
  const files = (event as CustomEvent<File[]>).detail
  if (!files?.length)
    return
  for (const file of files)
    await insertLocalImage(file)
}

// --- Image upload / local insert (follows imgHost selection in 图床 panel) ---
async function getImageHost(): Promise<string> {
  const host = (await store.get(`imgHost`)) || `local`
  await store.set(`imgHost`, host)
  return host
}

async function beforeImageUpload(file: File): Promise<File | false> {
  const checkResult = validateImageFile(file, t)
  if (!checkResult.ok) {
    toast.error(checkResult.msg)
    return false
  }

  const imgHost = await getImageHost()
  if (imgHost === `local`)
    return checkResult.file

  const config = await store.get(`${imgHost}Config`)
  const isValidHost = imgHost === `default` || config
  if (!isValidHost) {
    const hostLabel = uploadHostOptions.value.find(option => option.value === imgHost)?.label ?? imgHost
    toast.error(t('editorPanel.configureImgHost', { host: hostLabel }))
    toggleShowUploadImgDialog(true)
    return false
  }

  return checkResult.file
}

function insertMarkdownImage(src: string) {
  if (!src)
    return
  const markdownImage = formatMarkdownImage(src)
  if (!markdownImage)
    return
  if (codeMirrorView.value) {
    codeMirrorView.value.dispatch(codeMirrorView.value.state.replaceSelection(`\n${markdownImage}\n`))
    // 立即刷新预览，避免大 data URL 仅依赖防抖时预览滞后或丢失
    clearTimeout(changeTimer.value)
    commitEditorContentToPost()
    editorRefresh()
  }
}

function uploaded(imageUrl: string) {
  if (!imageUrl) {
    toast.error(t('editorPanel.uploadUnknownError'))
    return
  }
  setTimeout(() => {
    toggleShowUploadImgDialog(false)
  }, 1000)
  insertMarkdownImage(imageUrl)
  toast.success(t('editorPanel.uploadSuccess'))
}

/**
 * Insert image as local asset / data URL — does not use cloud image hosts.
 */
async function insertLocalImage(file: File) {
  const checkResult = validateImageFile(file, t)
  if (!checkResult.ok) {
    toast.error(checkResult.msg)
    return false
  }
  try {
    isImgLoading.value = true
    const docPath = currentPost.value?.path ?? null
    const { src, mode } = await resolveLocalImageMarkdownSrc(checkResult.file, docPath)
    insertMarkdownImage(src)
    toast.success(
      mode === `data`
        ? t('editorPanel.localImageInserted')
        : t('editorPanel.localImageSaved'),
    )
    return true
  }
  catch (err) {
    toast.error((err as Error)?.message || t('editorPanel.uploadUnknownError'))
    return false
  }
  finally {
    isImgLoading.value = false
  }
}

async function compressImage(file: File) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  const compressed = await imageCompression(file, options)
  // browser-image-compression returns a new Blob/File — keep desktop path mapping
  const { copyFileSystemPath } = await import(`@/lib/documents/file-path-map`)
  if (compressed instanceof File) {
    copyFileSystemPath(file, compressed)
  }
  else {
    const named = new File([compressed], file.name, { type: compressed.type || file.type })
    copyFileSystemPath(file, named)
    return named
  }
  return compressed
}

/**
 * Unified image intake: local host → local path/assets; otherwise cloud upload.
 * Paste / dialog / drag all share this so behavior matches 图床 default selection.
 */
async function uploadImage(
  file: File,
  cb?: { (url: any, data: string): void, (arg0: unknown): void } | undefined,
  applyUrl?: boolean,
) {
  try {
    const validated = await beforeImageUpload(file)
    if (!validated) {
      if (cb)
        cb(``, ``)
      return
    }
    file = validated

    const imgHost = await getImageHost()
    if (imgHost === `local`) {
      const ok = await insertLocalImage(file)
      if (cb)
        cb(ok ? `local` : ``, ``)
      if (ok && applyUrl) {
        setTimeout(toggleShowUploadImgDialog, 600, false)
      }
      return
    }

    isImgLoading.value = true
    const useCompression = (await store.get(`useCompression`)) === `true`
    if (useCompression) {
      file = await compressImage(file)
    }
    const base64Content = await toBase64(file)
    const url = await fileUpload(base64Content, file)
    if (cb) {
      cb(url, base64Content)
    }
    else {
      uploaded(url)
    }
    if (applyUrl) {
      return uploaded(url)
    }
  }
  catch (err) {
    toast.error((err as any).message)
    if (cb)
      cb(``, ``)
  }
  finally {
    isImgLoading.value = false
  }
}

// --- Drag & drop folder ---
async function getMd({ list }: { list: { path: string, file: File }[] }) {
  return new Promise<{ str: string, file: File, path: string }>((resolve) => {
    const { path, file } = list.find(item => item.path.match(/\.md$/))!
    const reader = new FileReader()
    reader.readAsText(file!, `UTF-8`)
    reader.onload = (evt) => {
      resolve({
        str: evt.target!.result as string,
        file,
        path,
      })
    }
  })
}

async function showFileStructure(root: any) {
  const result = []
  let cwd = ``
  try {
    const dirs = [root]
    for (const dir of dirs) {
      cwd += `${dir.name}/`
      for await (const [, handle] of dir) {
        if (handle.kind === `file`) {
          result.push({
            path: cwd + handle.name,
            file: await handle.getFile(),
          })
        }
        else {
          result.push({
            path: `${cwd + handle.name}/`,
          })
          dirs.push(handle)
        }
      }
    }
  }
  catch (err) {
    console.error(err)
  }
  return result
}

async function uploadMdImg({
  md,
  list,
}: {
  md: { str: string, path: string, file: File }
  list: { path: string, file: File }[]
}) {
  const mdImgList = [...(md.str.matchAll(/!\[(.*?)\]\((.*?)\)/g) || [])].filter(item => item)
  const root = md.path.match(/.+?\//)![0]
  const resList = await Promise.all<{ matchStr: string, url: string }>(
    mdImgList.map((item) => {
      return new Promise((resolve) => {
        let [, , matchStr] = item
        matchStr = matchStr.replace(/^.\//, ``)
        const { file }
          = list.find(f => f.path === `${root}${matchStr}`) || {}
        uploadImage(file!, url => resolve({ matchStr, url }))
      })
    }),
  )
  resList.forEach((item) => {
    md.str = md.str
      .replace(`](./${item.matchStr})`, `](${item.url})`)
      .replace(`](${item.matchStr})`, `](${item.url})`)
  })
  if (codeMirrorView.value) {
    codeMirrorView.value.dispatch({
      changes: { from: 0, to: codeMirrorView.value.state.doc.length, insert: md.str },
    })
  }
}

function mdLocalToRemote() {
  const dom = codeMirrorWrapper.value!

  dom.ondragover = evt => evt.preventDefault()
  dom.ondrop = async (evt) => {
    evt.preventDefault()
    if (evt.dataTransfer == null || !Array.isArray(evt.dataTransfer.items)) {
      return
    }

    for (const item of evt.dataTransfer.items.filter(item => item.kind === `file`)) {
      item
        .getAsFileSystemHandle()
        .then(async (handle: { kind: string, getFile: () => any }) => {
          if (handle.kind === `directory`) {
            const list = (await showFileStructure(handle)) as {
              path: string
              file: File
            }[]
            const md = await getMd({ list })
            uploadMdImg({ md, list })
          }
          else {
            const file = await handle.getFile()
            if (file.type.startsWith(`image/`))
              void uploadImage(file)
          }
        })
    }
  }
}

// --- Image paste handler for CodeMirror ---
function createPasteHandler() {
  return (event: ClipboardEvent, view: EditorView) => {
    // 1. 剪贴板图片：按图床面板当前选择（本地插入 / 云上传）
    if (event.clipboardData?.items && [...event.clipboardData.items].some(item => item.kind === 'file')) {
      if (isImgLoading.value) {
        return true
      }
      event.preventDefault()
      const files = Array.from(event.clipboardData.items, item => item.getAsFile())
        .filter((item): item is File => item != null && item.type.startsWith(`image/`))
      if (files.length === 0)
        return true
      void (async () => {
        for (const item of files)
          await uploadImage(item)
      })()
      return true
    }

    // 2. 处理剪贴板中的文本 (检测 Markdown 图片链接)
    const text = event.clipboardData?.getData('text/plain')
    if (text) {
      const mdImgRegex = /!\[(.*?)\]\((https?:\/\/[^)]+)\)/g
      const matches = [...text.matchAll(mdImgRegex)]

      if (matches.length > 0) {
        isImgLoading.value = true

        let previewText = text
        const placeholderMap = new Map<string, { originalUrl: string, originalAlt: string }>()

        let matchIndex = 0
        previewText = previewText.replace(mdImgRegex, (_, alt, url) => {
          const id = `LOADING_${Date.now()}_${matchIndex++}`
          placeholderMap.set(id, { originalUrl: url, originalAlt: alt })
          return `![${t('editorPanel.reuploading')}](${id})`
        })

        view.dispatch(view.state.replaceSelection(previewText))

        const uniqueUrls = [...new Set(matches.map(m => m[2]))]

        Promise.all(uniqueUrls.map(async (url) => {
          try {
            const newUrl = enableImageReupload.value ? await upload(url) : url

            for (const [id, info] of placeholderMap.entries()) {
              if (info.originalUrl === url) {
                const searchStr = `![${t('editorPanel.reuploading')}](${id})`
                const currentDoc = view.state.doc.toString()
                const pos = currentDoc.indexOf(searchStr)

                if (pos !== -1) {
                  const newText = `![${info.originalAlt}](${newUrl})`
                  view.dispatch({
                    changes: { from: pos, to: pos + searchStr.length, insert: newText },
                  })
                }
              }
            }
          }
          catch (e) {
            console.error(`转存失败: ${url}`, e)
            for (const [id, info] of placeholderMap.entries()) {
              if (info.originalUrl === url) {
                const searchStr = `![${t('editorPanel.reuploading')}](${id})`
                const currentDoc = view.state.doc.toString()
                const pos = currentDoc.indexOf(searchStr)

                if (pos !== -1) {
                  const newText = `![${info.originalAlt}](${info.originalUrl})`
                  view.dispatch({
                    changes: { from: pos, to: pos + searchStr.length, insert: newText },
                  })
                }
              }
            }
            toast.error(t('editorPanel.reuploadFailed'))
          }
        })).finally(() => {
          isImgLoading.value = false
        })

        return true
      }
    }
    return false
  }
}

// --- CodeMirror creation ---
function createFormTextArea(dom: HTMLDivElement) {
  const state = EditorState.create({
    doc: posts.value[currentPostIndex.value].content,
    extensions: [
      markdownSetup({
        onSearch: openSearchWithSelection,
        onReplace: openReplaceWithSelection,
        onGoToLine: () => uiStore.requestGoToLine(),
        withoutHistory: true,
      }),
      historyCompartment.of(history()),
      Prec.high(keymap.of([
        { key: `Mod-Alt-ArrowUp`, run: view => jumpToAdjacentHeading(view, `prev`) },
        { key: `Mod-Alt-ArrowDown`, run: view => jumpToAdjacentHeading(view, `next`) },
        // Ctrl/Cmd+S 由全局 keydown 统一处理，避免与 document 监听重复保存
      ])),
      placeholderCompartment.of(editorPlaceholder()),
      themeCompartment.of(theme(isDark.value)),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          clearTimeout(changeTimer.value)
          changeTimer.value = setTimeout(() => {
            editorRefresh()
            commitEditorContentToPost()
          }, 300)
        }
      }),
      EditorView.domEventHandlers({
        paste: createPasteHandler(),
      }),
      ...createSlashExtension(() => codeMirrorView.value),
    ],
  })

  const view = new EditorView({
    state,
    parent: dom,
  })

  codeMirrorView.value = view
  return view
}

// --- Lifecycle ---
function handleMathJaxReady() {
  editorRefresh()
}

async function preloadMathJaxIfNeeded(content: string) {
  if (!contentHasMath(content))
    return

  try {
    await loadMathJax()
  }
  catch (error) {
    console.error(error)
  }
}

let postSwitchGeneration = 0

function flushEditorContentToPostAtIndex(index: number) {
  clearTimeout(changeTimer.value)
  changeTimer.value = undefined
  if (!codeMirrorView.value || index < 0)
    return

  const value = codeMirrorView.value.state.doc.toString()
  const post = posts.value[index]
  if (!post || value === post.content)
    return

  post.updateDatetime = new Date()
  post.content = value
  post.dirty = true
}

function commitEditorContentToPost() {
  flushEditorContentToPostAtIndex(currentPostIndex.value)
}

onMounted(() => {
  window.addEventListener(`easymd-insert-local-images`, handleInsertLocalImagesEvent as EventListener)

  const editorDom = editorRef.value
  if (editorDom == null) {
    void completeInitialPreviewBoot()
    return
  }

  window.addEventListener(MATHJAX_READY_EVENT, handleMathJaxReady)

  renderStore.initRendererInstance({
    isMacCodeBlock: themeStore.isMacCodeBlock,
    isShowLineNumber: themeStore.isShowLineNumber,
  })

  themeStore.applyCurrentTheme()

  void nextTick(async () => {
    const editorView = createFormTextArea(editorDom)
    editor.value = editorView
    editorStore.registerContentFlush(commitEditorContentToPost)

    const content = posts.value[currentPostIndex.value]?.content ?? ``
    await preloadMathJaxIfNeeded(content)

    editorRefresh()
    mdLocalToRemote()
    void completeInitialPreviewBoot()
  })

  // capture: 优先拦截 Ctrl+S，避免浏览器默认保存网页
  document.addEventListener(`keydown`, handleGlobalKeydown, { passive: false, capture: true })
})

watch(isDark, () => {
  if (codeMirrorView.value) {
    codeMirrorView.value.dispatch({
      effects: themeCompartment.reconfigure(theme(isDark.value)),
    })
  }
  editorRefresh()
})

watch(locale, () => {
  if (!codeMirrorView.value)
    return
  codeMirrorView.value.dispatch({
    effects: placeholderCompartment.reconfigure(editorPlaceholder()),
  })
})

function syncEditorToPostContent(content: string) {
  const view = codeMirrorView.value
  if (!view)
    return

  const currentContent = view.state.doc.toString()
  if (currentContent === content)
    return

  const generation = ++postSwitchGeneration
  replaceDocumentWithoutHistory(view, content)
  resetEditorHistory(view, historyCompartment)
  void preloadMathJaxIfNeeded(content).then(() => {
    if (generation !== postSwitchGeneration)
      return
    editorRefresh()
  })
}

watch(currentPostIndex, (newIndex, oldIndex) => {
  if (oldIndex !== undefined && oldIndex >= 0)
    flushEditorContentToPostAtIndex(oldIndex)

  const post = posts.value[newIndex]
  if (!post)
    return
  syncEditorToPostContent(post.content)
})

/** 云端同步等外部写入 posts 时，当前文章 index 不变也需刷新编辑器 */
watch(
  () => currentPost.value?.content,
  (content) => {
    if (content == null)
      return
    syncEditorToPostContent(content)
  },
)

// 历史记录的定时器
const historyTimer = ref<ReturnType<typeof setTimeout>>()
onMounted(() => {
  historyTimer.value = setInterval(() => {
    const currentPost = posts.value[currentPostIndex.value]

    const pre = (currentPost.history || [])[0]?.content
    if (pre === currentPost.content) {
      return
    }

    currentPost.history ??= []
    currentPost.history.unshift({
      content: currentPost.content,
      datetime: formatLocalDateTime(),
    })

    currentPost.history.length = Math.min(currentPost.history.length, 10)
  }, 30 * 1000)
})

onUnmounted(() => {
  editorStore.unregisterContentFlush()
  window.removeEventListener(MATHJAX_READY_EVENT, handleMathJaxReady)
  window.removeEventListener(`easymd-insert-local-images`, handleInsertLocalImagesEvent as EventListener)
  clearTimeout(historyTimer.value)
  clearTimeout(changeTimer.value)
  document.removeEventListener(`keydown`, handleGlobalKeydown, { capture: true })
})

defineExpose({
  codeMirrorView,
  editorRefresh,
  uploadImage,
  insertLocalImage,
  isImgLoading,
})
</script>

<template>
  <div
    v-show="viewMode !== 'preview'"
    ref="codeMirrorWrapper"
    class="codeMirror-wrapper relative flex h-full flex-col overflow-hidden"
    @contextmenu.capture="onWrapperContextMenuCapture"
  >
    <EditorToolbar />
    <div class="relative min-h-0 flex-1">
      <SearchTab v-if="codeMirrorView" ref="searchTabRef" :editor-view="codeMirrorView as any" />
      <SlashCommandMenu
        :visible="slashVisible"
        :position="slashPosition"
        :active-index="slashActiveIndex"
        :filter="slashFilter"
        :container-el="codeMirrorWrapper"
        :basic-commands="slashBasicCommands"
        :common-commands="slashCommonCommands"
        :edit-commands="slashEditCommands"
        :style-commands="slashStyleCommands"
        :filtered-commands="slashFilteredCommands"
        @execute="(cmd) => codeMirrorView && executeSlashCommand(codeMirrorView, cmd)"
        @close="closeSlashMenu()"
      />
      <EditorContextMenu>
        <div
          id="editor"
          ref="editorRef"
          class="codemirror-container mathjax-ignore h-full"
        />
      </EditorContextMenu>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('../../assets/less/app.less');
</style>

<style lang="less" scoped>
.codeMirror-wrapper {
  overflow-x: hidden;
  height: 100%;
  position: relative;
}
</style>
