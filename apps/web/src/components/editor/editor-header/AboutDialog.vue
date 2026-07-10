<script setup lang="ts">
import { HelpCircle } from '@lucide/vue'
import { computed } from 'vue'
import PanelDialog from '@/components/shared/panel-dialog/PanelDialog.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const dialogOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit(`update:open`, val),
})

const logoUrl = `${import.meta.env.BASE_URL}assets/images/logo.png`
</script>

<template>
  <PanelDialog
    v-model:open="dialogOpen"
    :title="t('about.title')"
    :description="t('about.description')"
    :icon="HelpCircle"
  >
    <div class="space-y-4 px-4 py-4 text-center sm:px-6">
      <img
        class="mx-auto size-24 rounded-xl ring-1 ring-border"
        :src="logoUrl"
        :alt="t('about.imageAlt')"
      >
      <p class="text-lg font-medium">
        EasyMD
      </p>
      <p class="text-sm text-muted-foreground">
        {{ t('about.followHint') }}
      </p>
    </div>
  </PanelDialog>
</template>
