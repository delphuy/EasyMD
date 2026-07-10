<script setup lang="ts">
import { readTextFile } from '@md/desktop-fs'
import CodemirrorEditor from '@/components/editor/CodemirrorEditor.vue'
import CommandPalette from '@/components/editor/dialogs/CommandPalette.vue'
import ConfirmDialog from '@/components/shared/confirm-dialog/ConfirmDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { setupDesktopFileOpen } from '@/composables/useDesktopFileOpen'
import { useCommandPaletteHotkey } from '@/composables/useCommandPaletteHotkey'
import { usePreferencesHotkey } from '@/composables/usePreferencesHotkey'
import { t } from '@/i18n/translate'
import { usePostStore } from '@/stores/post'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const postStore = usePostStore()
const { isDark } = storeToRefs(uiStore)

usePlatformEnv()
useDeepLinkImport()
useCommandPaletteHotkey()
usePreferencesHotkey()

onMounted(() => {
  void setupDesktopFileOpen(async (paths) => {
    try {
      const { opened } = await postStore.openDocumentsFromPaths(paths, readTextFile)
      if (opened > 0)
        toast.success(t(`store.post.openedFiles`, { count: opened }))
    }
    catch (error) {
      console.error(error)
      toast.error(t(`store.post.openFilesFailed`))
    }
  })
})
</script>

<template>
  <CodemirrorEditor />

  <CommandPalette />

  <ConfirmDialog />

  <Toaster
    rich-colors
    position="top-center"
    :duration="1200"
    :visible-toasts="1"
    :theme="isDark ? 'dark' : 'light'"
  />
</template>
