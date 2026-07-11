<script setup lang="ts">
import { Blocks, ImagePlus, Table, UploadCloud } from '@lucide/vue'
import { useEditorToolbarActions } from '@/composables/useEditorToolbarActions'
import { normalizeFormulaInput } from '@/lib/markdown/formula'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'

const props = withDefaults(defineProps<{
  asSub?: boolean
}>(), {
  asSub: false,
})

const { asSub } = toRefs(props)
const { t } = useI18n()
const uiStore = useUIStore()
const editorStore = useEditorStore()
const toolbarActions = useEditorToolbarActions()

const { toggleShowInsertFormDialog, toggleShowComponentDialog, toggleShowUploadImgDialog } = uiStore

function openFormulaEditor() {
  const selection = normalizeFormulaInput(editorStore.getSelection())
  uiStore.openFormulaEditor({
    value: selection.latex,
    displayMode: selection.displayMode,
  })
}
</script>

<template>
  <!-- 作为 MenubarSub 使用 -->
  <MenubarSub v-if="asSub">
    <MenubarSubTrigger>
      {{ t('menu.insert') }}
    </MenubarSubTrigger>
    <MenubarSubContent class="w-56">
      <MenubarItem @click="toolbarActions.image()">
        <ImagePlus class="mr-2 h-4 w-4" />
        {{ t('menu.image') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowUploadImgDialog(true)">
        <UploadCloud class="mr-2 h-4 w-4" />
        {{ t('menu.imageHost') }}
      </MenubarItem>
      <MenubarItem @click="openFormulaEditor()">
        <span class="mr-2 inline-flex h-4 w-4 items-center justify-center text-xs font-semibold">ƒ</span>
        {{ t('menu.formula') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowInsertFormDialog()">
        <Table class="mr-2 h-4 w-4" />
        {{ t('menu.table') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowComponentDialog()">
        <Blocks class="mr-2 h-4 w-4" />
        {{ t('menu.component') }}
      </MenubarItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 作为 MenubarMenu 使用（默认） -->
  <MenubarMenu v-else>
    <MenubarTrigger>
      {{ t('menu.insert') }}
    </MenubarTrigger>
    <MenubarContent class="w-56" align="start">
      <MenubarItem @click="toolbarActions.image()">
        <ImagePlus class="mr-2 h-4 w-4" />
        {{ t('menu.image') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowUploadImgDialog(true)">
        <UploadCloud class="mr-2 h-4 w-4" />
        {{ t('menu.imageHost') }}
      </MenubarItem>
      <MenubarItem @click="openFormulaEditor()">
        <span class="mr-2 inline-flex h-4 w-4 items-center justify-center text-xs font-semibold">ƒ</span>
        {{ t('menu.formula') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowInsertFormDialog()">
        <Table class="mr-2 h-4 w-4" />
        {{ t('menu.table') }}
      </MenubarItem>
      <MenubarItem @click="toggleShowComponentDialog()">
        <Blocks class="mr-2 h-4 w-4" />
        {{ t('menu.component') }}
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
