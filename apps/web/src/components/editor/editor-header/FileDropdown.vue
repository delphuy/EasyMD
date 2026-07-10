<script setup lang="ts">
import { Download, FileCode, FileCog, FilePlus2, FileText, FolderKanban, FolderOpen, Package, Save, Settings, Upload } from '@lucide/vue'
import { ctrlSign } from '@md/shared/configs'
import { useDocumentSave } from '@/composables/useDocumentSave'
import { useOpenLocalDocuments } from '@/composables/useOpenLocalDocuments'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { useUIStore } from '@/stores/ui'

const props = withDefaults(defineProps<{
  asSub?: boolean
}>(), {
  asSub: false,
})

const { asSub } = toRefs(props)
const { t } = useI18n()

const editorStore = useEditorStore()
const exportStore = useExportStore()
const uiStore = useUIStore()
const { openLocalDocuments } = useOpenLocalDocuments()
const { saveCurrentDocument } = useDocumentSave()

const { isOpenPostSlider, isOpenFolderPanel } = storeToRefs(uiStore)
const { toggleShowTemplateDialog, toggleShowImportMdDialog, toggleShowEditorStateDialog, toggleShowPreferencesDialog } = uiStore

function openEditorStateDialog() {
  toggleShowEditorStateDialog(true)
}

function openPreferencesDialog() {
  toggleShowPreferencesDialog(true)
}

function openTemplateDialog() {
  toggleShowTemplateDialog(true)
}

function openFiles() {
  void openLocalDocuments()
}

function saveDocument() {
  void saveCurrentDocument(`save`)
}

function saveDocumentAs() {
  void saveCurrentDocument(`saveAs`)
}

// Export functions
function exportEditorContent2HTML() {
  exportStore.exportEditorContent2HTML()
}

function exportEditorContent2PureHTML() {
  exportStore.exportEditorContent2PureHTML(editorStore.getContent())
}

function exportEditorContent2MD() {
  exportStore.exportEditorContent2MD(editorStore.getContent())
}

function downloadAsCardImage() {
  exportStore.downloadAsCardImage()
}

function exportEditorContent2PDF() {
  exportStore.exportEditorContent2PDF()
}

function exportEditorContent2Word() {
  void exportStore.exportEditorContent2Word()
}
</script>

<template>
  <!-- 作为 MenubarSub 使用 -->
  <MenubarSub v-if="asSub">
    <MenubarSubTrigger>
      {{ t('menu.file') }}
    </MenubarSubTrigger>
    <MenubarSubContent class="min-w-56">
      <!-- 打开文件 -->
      <MenubarItem @click="openFiles()">
        <FilePlus2 class="mr-2 size-4" />
        {{ t('menu.openFiles') }}
      </MenubarItem>

      <!-- 本地文件夹 -->
      <MenubarItem @click="isOpenFolderPanel = !isOpenFolderPanel">
        <FolderOpen class="mr-2 size-4" />
        {{ t('menu.localFolder') }}
      </MenubarItem>

      <MenubarSeparator />

      <MenubarItem @click="saveDocument()">
        <Save class="mr-2 size-4" />
        {{ t('menu.save') }}
        <MenubarShortcut>
          <kbd class="mx-1 bg-gray-2 dark:bg-stone-9">{{ ctrlSign }}</kbd>
          <kbd class="mx-1 bg-gray-2 dark:bg-stone-9">S</kbd>
        </MenubarShortcut>
      </MenubarItem>
      <MenubarItem @click="saveDocumentAs()">
        <Save class="mr-2 size-4" />
        {{ t('menu.saveAs') }}
      </MenubarItem>

      <MenubarSeparator />

      <!-- 导入子菜单 -->
      <MenubarSub>
        <MenubarSubTrigger>
          <Upload class="mr-2 size-4" />
          {{ t('menu.import') }}
        </MenubarSubTrigger>
        <MenubarSubContent class="min-w-56">
          <MenubarItem @click="toggleShowImportMdDialog(true)">
            <FileText class="mr-2 size-4" />
            {{ t('menu.importMarkdown') }}
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>

      <!-- 导出子菜单 -->
      <MenubarSub>
        <MenubarSubTrigger>
          <Download class="mr-2 size-4" />
          {{ t('menu.export') }}
        </MenubarSubTrigger>
        <MenubarSubContent class="min-w-56">
          <MenubarItem @click="exportEditorContent2MD()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportMarkdown') }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @click="exportEditorContent2HTML()">
            <FileCode class="mr-2 size-4" />
            {{ t('menu.exportHtml') }}
          </MenubarItem>
          <MenubarItem @click="exportEditorContent2PureHTML()">
            <FileCode class="mr-2 size-4" />
            {{ t('menu.exportHtmlNoStyle') }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @click="exportEditorContent2PDF()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportPdf') }}
          </MenubarItem>
          <MenubarItem @click="exportEditorContent2Word()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportWord') }}
          </MenubarItem>
          <MenubarItem @click="downloadAsCardImage()">
            <Download class="mr-2 size-4" />
            {{ t('menu.exportPng') }}
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>

      <MenubarSeparator />

      <!-- 模板管理 -->
      <MenubarItem @click="openTemplateDialog()">
        <Package class="mr-2 size-4" />
        {{ t('menu.templateManage') }}
      </MenubarItem>

      <!-- 内容管理 -->
      <MenubarItem @click="isOpenPostSlider = !isOpenPostSlider">
        <FolderKanban class="mr-2 size-4" />
        {{ t('menu.contentManage') }}
      </MenubarItem>

      <MenubarSeparator />

      <!-- 偏好设置 -->
      <MenubarItem @click="openPreferencesDialog()">
        <Settings class="mr-2 size-4" />
        {{ t('menu.preferences') }}
      </MenubarItem>

      <!-- 导入/导出配置 -->
      <MenubarItem @click="openEditorStateDialog()">
        <FileCog class="mr-2 size-4" />
        {{ t('menu.importExportConfig') }}
      </MenubarItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 作为 MenubarMenu 使用（默认） -->
  <MenubarMenu v-else>
    <MenubarTrigger>
      {{ t('menu.file') }}
    </MenubarTrigger>
    <MenubarContent class="min-w-56" align="start">
      <!-- 打开文件 -->
      <MenubarItem @click="openFiles()">
        <FilePlus2 class="mr-2 size-4" />
        {{ t('menu.openFiles') }}
      </MenubarItem>

      <!-- 本地文件夹 -->
      <MenubarItem @click="isOpenFolderPanel = !isOpenFolderPanel">
        <FolderOpen class="mr-2 size-4" />
        {{ t('menu.localFolder') }}
      </MenubarItem>

      <MenubarSeparator />

      <MenubarItem @click="saveDocument()">
        <Save class="mr-2 size-4" />
        {{ t('menu.save') }}
        <MenubarShortcut>
          <kbd class="mx-1 bg-gray-2 dark:bg-stone-9">{{ ctrlSign }}</kbd>
          <kbd class="mx-1 bg-gray-2 dark:bg-stone-9">S</kbd>
        </MenubarShortcut>
      </MenubarItem>
      <MenubarItem @click="saveDocumentAs()">
        <Save class="mr-2 size-4" />
        {{ t('menu.saveAs') }}
      </MenubarItem>

      <MenubarSeparator />

      <!-- 导入子菜单 -->
      <MenubarSub>
        <MenubarSubTrigger>
          <Upload class="mr-2 size-4" />
          {{ t('menu.import') }}
        </MenubarSubTrigger>
        <MenubarSubContent class="min-w-56">
          <MenubarItem @click="toggleShowImportMdDialog(true)">
            <FileText class="mr-2 size-4" />
            {{ t('menu.importMarkdown') }}
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>

      <!-- 导出子菜单 -->
      <MenubarSub>
        <MenubarSubTrigger>
          <Download class="mr-2 size-4" />
          {{ t('menu.export') }}
        </MenubarSubTrigger>
        <MenubarSubContent class="min-w-56">
          <MenubarItem @click="exportEditorContent2MD()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportMarkdown') }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @click="exportEditorContent2HTML()">
            <FileCode class="mr-2 size-4" />
            {{ t('menu.exportHtml') }}
          </MenubarItem>
          <MenubarItem @click="exportEditorContent2PureHTML()">
            <FileCode class="mr-2 size-4" />
            {{ t('menu.exportHtmlNoStyle') }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @click="exportEditorContent2PDF()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportPdf') }}
          </MenubarItem>
          <MenubarItem @click="exportEditorContent2Word()">
            <FileText class="mr-2 size-4" />
            {{ t('menu.exportWord') }}
          </MenubarItem>
          <MenubarItem @click="downloadAsCardImage()">
            <Download class="mr-2 size-4" />
            {{ t('menu.exportPng') }}
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>

      <MenubarSeparator />

      <!-- 模板管理 -->
      <MenubarItem @click="openTemplateDialog()">
        <Package class="mr-2 size-4" />
        {{ t('menu.templateManage') }}
      </MenubarItem>

      <!-- 内容管理 -->
      <MenubarItem @click="isOpenPostSlider = !isOpenPostSlider">
        <FolderKanban class="mr-2 size-4" />
        {{ t('menu.contentManage') }}
      </MenubarItem>

      <MenubarSeparator />

      <!-- 偏好设置 -->
      <MenubarItem @click="openPreferencesDialog()">
        <Settings class="mr-2 size-4" />
        {{ t('menu.preferences') }}
      </MenubarItem>

      <!-- 导入/导出配置 -->
      <MenubarItem @click="openEditorStateDialog()">
        <FileCog class="mr-2 size-4" />
        {{ t('menu.importExportConfig') }}
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
