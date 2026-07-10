<script setup lang="ts">
import {
  ChevronDown,
  Columns2,
  Copy,
  Eye,
  FolderOpen,
  Loader2,
  Menu,
  Monitor,
  Moon,
  Palette,
  PenLine,
  Smartphone,
  Sun,
} from '@lucide/vue'
import { defineAsyncComponent } from 'vue'
import { useEditorRefresh } from '@/composables/useEditorRefresh'
import { generatePureHTML, processClipboardContent } from '@/services/export'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { useRenderStore } from '@/stores/render'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import EditDropdown from './EditDropdown.vue'
import FileDropdown from './FileDropdown.vue'
import FormatDropdown from './FormatDropdown.vue'
import HelpDropdown from './HelpDropdown.vue'
import InsertDropdown from './InsertDropdown.vue'
import StyleDropdown from './StyleDropdown.vue'

const emit = defineEmits([`startCopy`, `endCopy`])
const { t } = useI18n()
const AboutDialog = defineAsyncComponent(() => import('./AboutDialog.vue'))
const EditorStateDialog = defineAsyncComponent(() => import('@/components/editor/dialogs/EditorStateDialog.vue'))
const PreferencesDialog = defineAsyncComponent(() => import('@/components/editor/dialogs/PreferencesDialog.vue'))
const MarkdownHelpDialog = defineAsyncComponent(() => import('./MarkdownHelpDialog.vue'))
const KeyboardShortcutsDialog = defineAsyncComponent(() => import('./KeyboardShortcutsDialog.vue'))

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const renderStore = useRenderStore()
const uiStore = useUIStore()
const exportStore = useExportStore()
const { editorRefresh } = useEditorRefresh()

const { editor } = storeToRefs(editorStore)
const { output } = storeToRefs(renderStore)
const { primaryColor } = storeToRefs(themeStore)
const {
  isOpenRightSlider,
  isOpenFolderPanel,
  isShowAboutDialog,
  isShowEditorStateDialog,
  isShowPreferencesDialog,
  isShowMarkdownHelpDialog,
  isShowKeyboardShortcutsDialog,
  copyMode,
  viewMode,
  previewDevice,
  isDark,
} = storeToRefs(uiStore)

const isCopying = ref(false)

const viewModes = computed(() => [
  { key: `edit` as const, icon: PenLine, label: t(`footer.viewEdit`) },
  { key: `split` as const, icon: Columns2, label: t(`footer.viewSplit`) },
  { key: `preview` as const, icon: Eye, label: t(`footer.viewPreview`) },
])

const { copy: copyContent } = useClipboard({
  legacy: true,
})

const delay = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms))

const normalizeErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function writeClipboardItems(items: ClipboardItem[]) {
  if (!navigator.clipboard?.write) {
    throw new Error(`Clipboard API not available.`)
  }

  await delay(0)
  await navigator.clipboard.write(items)
}

function fallbackCopyUsingExecCommand(htmlContent: string) {
  const selection = window.getSelection()

  if (!selection) {
    return false
  }

  const tempContainer = document.createElement(`div`)
  tempContainer.innerHTML = htmlContent
  tempContainer.style.position = `fixed`
  tempContainer.style.left = `-9999px`
  tempContainer.style.top = `0`
  tempContainer.style.opacity = `0`
  tempContainer.style.pointerEvents = `none`
  tempContainer.style.setProperty(`background-color`, `#ffffff`, `important`)
  tempContainer.style.setProperty(`color`, `#000000`, `important`)

  document.body.appendChild(tempContainer)
  let successful = false

  try {
    const range = document.createRange()
    range.selectNodeContents(tempContainer)
    selection.removeAllRanges()
    selection.addRange(range)

    successful = document.execCommand(`copy`)
  }
  catch {
    successful = false
  }
  finally {
    selection.removeAllRanges()
    tempContainer.remove()
  }

  return successful
}

// 复制富文本（剪贴板 HTML / 纯文本）
async function copy() {
  isCopying.value = true

  // 如果是 Markdown 源码，直接复制并返回
  if (copyMode.value === `md`) {
    try {
      const mdContent = editor.value?.state.doc.toString() || ``
      await copyContent(mdContent)
      toast.success(t(`toast.copiedMarkdown`))
    }
    catch (error) {
      toast.error(t(`toast.copyFailed`, { message: normalizeErrorMessage(error) }))
    }
    finally {
      isCopying.value = false
    }
    return
  }

  // 以下处理非 Markdown 的复制流程
  emit(`startCopy`)

  setTimeout(() => {
    nextTick(async () => {
      try {
        let processedClipboardContent: {
          html: string
          plainText: string
          hasPendingAsyncContent: boolean
        }

        try {
          processedClipboardContent = await processClipboardContent(primaryColor.value)
        }
        catch (error) {
          toast.error(t(`toast.processHtmlFailed`, { message: normalizeErrorMessage(error) }))
          editorRefresh()
          return
        }

        if (processedClipboardContent.hasPendingAsyncContent) {
          toast.warning(t(`toast.asyncContentPending`))
        }

        const clipboardDiv = document.getElementById(`output`)

        if (!clipboardDiv) {
          toast.error(t(`toast.outputAreaMissing`))
          editorRefresh()
          return
        }

        clipboardDiv.focus()
        window.getSelection()?.removeAllRanges()

        const temp = processedClipboardContent.html

        if (copyMode.value === `txt`) {
          try {
            if (typeof ClipboardItem === `undefined`) {
              throw new TypeError(`ClipboardItem is not supported in this browser.`)
            }

            const clipboardItem = new ClipboardItem({
              'text/html': new Blob([temp], { type: `text/html` }),
              'text/plain': new Blob([processedClipboardContent.plainText], { type: `text/plain` }),
            })

            await writeClipboardItems([clipboardItem])
          }
          catch (error) {
            const fallbackSucceeded = fallbackCopyUsingExecCommand(temp)
            if (!fallbackSucceeded) {
              window.getSelection()?.removeAllRanges()
              editorRefresh()
              toast.error(t(`toast.copyFailedContactDev`, { message: normalizeErrorMessage(error) }))
              return
            }
          }
        }

        if (copyMode.value === `html`) {
          await copyContent(temp)
        }
        else if (copyMode.value === `html-without-style`) {
          await copyContent(await generatePureHTML(editor.value!.state.doc.toString()))
        }
        else if (copyMode.value === `html-and-style`) {
          await copyContent(exportStore.editorContent2HTML())
        }

        // 输出提示
        toast.success(
          copyMode.value === `html`
            ? t(`toast.copiedHtml`)
            : t(`toast.copiedRendered`),
        )
        window.dispatchEvent(
          new CustomEvent(`copyToMp`, {
            detail: {
              content: output.value,
            },
          }),
        )
        editorRefresh()
      }
      catch (error) {
        toast.error(t(`toast.copyFailed`, { message: normalizeErrorMessage(error) }))
        editorRefresh()
      }
      finally {
        emit(`endCopy`)
        isCopying.value = false
      }
    })
  }, 350)
}

function handleCopy(mode: string) {
  copyMode.value = mode
  copy()
}

function copyMarkdown() {
  handleCopy(`md`)
}

function copyHtml() {
  handleCopy(`html`)
}
</script>

<template>
  <header
    class="header-container h-15 flex flex-wrap items-center justify-between gap-2 px-5 relative"
  >
    <!-- 左侧：文件夹 + 菜单 -->
    <div class="flex items-center gap-1">
      <!-- 本地文件夹：图标按钮，文件菜单左侧 -->
      <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 shrink-0"
        :class="{ 'bg-accent text-accent-foreground': isOpenFolderPanel }"
        :title="isOpenFolderPanel ? t('header.collapseFolder') : t('menu.localFolder')"
        :aria-label="isOpenFolderPanel ? t('header.collapseFolder') : t('menu.localFolder')"
        @click="isOpenFolderPanel = !isOpenFolderPanel"
      >
        <FolderOpen class="size-4" />
      </Button>

      <!-- 桌面端菜单 -->
      <div class="space-x-1 hidden md:flex">
        <Menubar class="menubar border-0">
          <FileDropdown />
          <EditDropdown @copy="handleCopy" />
          <FormatDropdown />
          <InsertDropdown />
          <StyleDropdown />
          <HelpDropdown />
        </Menubar>
      </div>

      <!-- 移动端汉堡菜单 -->
      <div class="md:hidden">
        <Menubar class="menubar border-0 p-0">
          <MenubarMenu>
            <MenubarTrigger class="p-0">
              <Button variant="outline" size="icon">
                <Menu class="size-4" />
              </Button>
            </MenubarTrigger>
            <MenubarContent align="start">
              <FileDropdown :as-sub="true" />
              <EditDropdown :as-sub="true" @copy="handleCopy" />
              <FormatDropdown :as-sub="true" />
              <InsertDropdown :as-sub="true" />
              <StyleDropdown :as-sub="true" />
              <HelpDropdown :as-sub="true" />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>

    <!-- 右侧操作区 -->
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <!-- 编辑 / 双屏 / 预览 -->
      <div class="hidden sm:flex items-center gap-0.5 rounded-md border border-border p-0.5">
        <Button
          v-for="mode in viewModes"
          :key="mode.key"
          variant="ghost"
          size="sm"
          class="h-8 gap-1 px-2"
          :class="viewMode === mode.key ? 'bg-accent text-accent-foreground' : ''"
          :title="mode.label"
          @click="uiStore.setViewMode(mode.key)"
        >
          <component :is="mode.icon" class="size-3.5" />
          <span class="text-xs hidden lg:inline">{{ mode.label }}</span>
        </Button>
      </div>

      <!-- PC / Mobile 预览 -->
      <div
        v-if="viewMode !== 'edit'"
        class="hidden sm:flex items-center gap-0.5 rounded-md border border-border p-0.5"
      >
        <Button
          variant="ghost"
          size="sm"
          class="h-8 gap-1 px-2"
          :class="previewDevice === 'desktop' ? 'bg-accent text-accent-foreground' : ''"
          :title="t('footer.desktopPreview')"
          @click="uiStore.setPreviewDevice('desktop')"
        >
          <Monitor class="size-3.5" />
          <span class="text-xs hidden lg:inline">PC</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 gap-1 px-2"
          :class="previewDevice === 'mobile' ? 'bg-accent text-accent-foreground' : ''"
          :title="t('footer.mobilePreview')"
          @click="uiStore.setPreviewDevice('mobile')"
        >
          <Smartphone class="size-3.5" />
          <span class="text-xs hidden lg:inline">Mobile</span>
        </Button>
      </div>

      <!-- 浅色 / 深色 -->
      <Button
        variant="outline"
        size="icon"
        class="h-9 w-9"
        :title="isDark ? t('common.lightMode') : t('common.darkMode')"
        @click="uiStore.toggleDark()"
      >
        <Moon v-if="isDark" class="size-4" />
        <Sun v-else class="size-4" />
      </Button>

      <!-- 复制：MD / HTML -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="h-9" :disabled="isCopying">
            <Loader2 v-if="isCopying" class="mr-2 h-4 w-4 animate-spin" />
            <Copy v-else class="mr-2 h-4 w-4" />
            <span>{{ t('header.copy') }}</span>
            <ChevronDown class="ml-1 h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-40">
          <DropdownMenuItem @click="copyMarkdown">
            {{ t('menu.copyMdCode') }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="copyHtml">
            {{ t('menu.copyHtmlCode') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 样式面板 -->
      <Button
        variant="outline"
        class="h-9"
        :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
        @click="isOpenRightSlider = !isOpenRightSlider"
      >
        <Palette class="mr-2 h-4 w-4" />
        <span class="hidden sm:inline">{{ t('header.style') }}</span>
      </Button>
    </div>
  </header>

  <!-- 对话框组件，嵌套菜单无法正常挂载，需要提取层级 -->
  <AboutDialog v-if="isShowAboutDialog" v-model:open="isShowAboutDialog" />
  <EditorStateDialog v-if="isShowEditorStateDialog" v-model:open="isShowEditorStateDialog" />
  <PreferencesDialog v-model:open="isShowPreferencesDialog" />
  <MarkdownHelpDialog v-if="isShowMarkdownHelpDialog" v-model:open="isShowMarkdownHelpDialog" />
  <KeyboardShortcutsDialog v-if="isShowKeyboardShortcutsDialog" v-model:open="isShowKeyboardShortcutsDialog" />
</template>

<style lang="less" scoped>
.header-container {
  background: hsl(var(--background) / 0.95);
  border-bottom: 1px solid hsl(var(--border));
  backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;

  @media (max-width: 768px) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

.menubar {
  user-select: none;

  :deep([data-radix-menubar-trigger]) {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &:hover {
      background: hsl(var(--accent) / 0.8);
      color: hsl(var(--accent-foreground));
      transform: translateY(-1px);
    }

    &[data-state='open'] {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  :deep([data-radix-menubar-content]) {
    animation: slideDownAndFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :deep([data-radix-menubar-item]) {
    border-radius: 4px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: hsl(var(--accent) / 0.8);
    }
  }

  :deep([data-radix-menubar-sub-trigger]) {
    border-radius: 4px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: hsl(var(--accent) / 0.8);
    }
  }
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 1.5rem;
  height: 1.375rem;
  border: 1px solid hsl(var(--border));
  background: linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--muted) / 0.9));
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  box-shadow: 0 1px 0 hsl(var(--border)), inset 0 0.5px 0 hsl(var(--background));
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .menubar {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;

    > * {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
