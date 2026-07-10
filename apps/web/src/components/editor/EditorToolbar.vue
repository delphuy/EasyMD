<script setup lang="ts">
import {
  AlertTriangle,
  Bold,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  GitBranch,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Image,
  Info,
  Italic,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  ListTree,
  Minus,
  PieChart,
  Quote,
  Redo2,
  Save,
  Sigma,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Workflow,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEditorToolbarActions } from '@/composables/useEditorToolbarActions'

const { t, locale } = useI18n()
const actions = useEditorToolbarActions()

interface ToolbarItem {
  id: string
  label: string
  icon: any
  run: () => void
}

interface ToolbarGroup {
  id: string
  /** 放在第几行：1 常用格式，2 插入扩展 */
  row: 1 | 2
  items: ToolbarItem[]
}

const groups = computed<ToolbarGroup[]>(() => {
  void locale.value
  return [
    {
      id: `history`,
      row: 1,
      items: [
        { id: `undo`, label: t(`menu.undo`), icon: Undo2, run: actions.undo },
        { id: `redo`, label: t(`menu.redo`), icon: Redo2, run: actions.redo },
      ],
    },
    {
      id: `inline`,
      row: 1,
      items: [
        { id: `bold`, label: t(`menu.bold`), icon: Bold, run: actions.bold },
        { id: `italic`, label: t(`menu.italic`), icon: Italic, run: actions.italic },
        { id: `strike`, label: t(`menu.strikethrough`), icon: Strikethrough, run: actions.strikethrough },
        { id: `highlight`, label: t(`toolbar.highlight`), icon: Highlighter, run: actions.highlight },
        { id: `underline`, label: t(`toolbar.underline`), icon: Underline, run: actions.underline },
        { id: `inlineCode`, label: t(`menu.inlineCode`), icon: Code2, run: actions.inlineCode },
      ],
    },
    {
      id: `heading`,
      row: 1,
      items: [
        { id: `h1`, label: t(`menu.headingN`, { n: 1 }), icon: Heading1, run: () => actions.heading(1) },
        { id: `h2`, label: t(`menu.headingN`, { n: 2 }), icon: Heading2, run: () => actions.heading(2) },
        { id: `h3`, label: t(`menu.headingN`, { n: 3 }), icon: Heading3, run: () => actions.heading(3) },
        { id: `h4`, label: t(`menu.headingN`, { n: 4 }), icon: Heading4, run: () => actions.heading(4) },
      ],
    },
    {
      id: `list`,
      row: 1,
      items: [
        { id: `ul`, label: t(`menu.unorderedList`), icon: List, run: actions.unorderedList },
        { id: `ol`, label: t(`menu.orderedList`), icon: ListOrdered, run: actions.orderedList },
        { id: `quote`, label: t(`slash.blockquote`), icon: Quote, run: actions.blockquote },
        { id: `code`, label: t(`slash.codeBlock`), icon: Code2, run: actions.codeBlock },
        { id: `hr`, label: t(`toolbar.hr`), icon: Minus, run: actions.hr },
        { id: `toc`, label: t(`toolbar.toc`), icon: ListTree, run: actions.toc },
      ],
    },
    {
      id: `basic-insert`,
      row: 1,
      items: [
        { id: `image`, label: t(`menu.image`), icon: Image, run: actions.image },
        { id: `table`, label: t(`menu.table`), icon: Table, run: actions.table },
        { id: `link`, label: t(`menu.link`), icon: Link, run: actions.link },
        { id: `save`, label: t(`common.save`), icon: Save, run: actions.save },
      ],
    },
    {
      id: `datetime`,
      row: 2,
      items: [
        { id: `date`, label: t(`toolbar.date`), icon: Calendar, run: actions.insertDate },
        { id: `time`, label: t(`toolbar.time`), icon: Clock, run: actions.insertTime },
      ],
    },
    {
      id: `math`,
      row: 2,
      items: [
        { id: `formula`, label: t(`menu.formula`), icon: Sigma, run: actions.formula },
        { id: `blockMath`, label: t(`toolbar.blockMath`), icon: Sigma, run: actions.blockMath },
      ],
    },
    {
      id: `diagrams`,
      row: 2,
      items: [
        { id: `flowchart`, label: t(`toolbar.flowchart`), icon: GitBranch, run: actions.flowchart },
        { id: `pie`, label: t(`toolbar.mermaidPie`), icon: PieChart, run: actions.mermaidPie },
        { id: `plantuml`, label: t(`toolbar.plantuml`), icon: Workflow, run: actions.plantuml },
        { id: `infographic`, label: t(`toolbar.infographic`), icon: PieChart, run: actions.infographic },
      ],
    },
    {
      id: `extra`,
      row: 2,
      items: [
        { id: `ruby`, label: t(`toolbar.ruby`), icon: BookOpen, run: actions.ruby },
        { id: `alertNote`, label: t(`toolbar.alertNote`), icon: Info, run: () => actions.alert(`NOTE`) },
        { id: `alertTip`, label: t(`toolbar.alertTip`), icon: Lightbulb, run: () => actions.alert(`TIP`) },
        { id: `alertWarn`, label: t(`toolbar.alertWarning`), icon: AlertTriangle, run: () => actions.alert(`WARNING`) },
      ],
    },
  ]
})

const row1 = computed(() => groups.value.filter(g => g.row === 1))
const row2 = computed(() => groups.value.filter(g => g.row === 2))
</script>

<template>
  <div
    class="editor-toolbar sticky top-0 z-20 flex shrink-0 flex-col gap-0.5 border-b border-border bg-background/95 px-1.5 py-1 backdrop-blur-sm"
    role="toolbar"
    :aria-label="t('toolbar.label')"
  >
    <TooltipProvider :delay-duration="300">
      <!-- 第一行：格式与结构（自动换行，无横向滚动） -->
      <div class="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
        <template v-for="(group, gi) in row1" :key="group.id">
          <div
            v-if="gi > 0"
            class="mx-0.5 hidden h-5 w-px shrink-0 bg-border sm:block"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-center gap-0.5">
            <Tooltip v-for="item in group.items" :key="item.id">
              <TooltipTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  :aria-label="item.label"
                  @click="item.run()"
                >
                  <component :is="item.icon" class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" :side-offset="4" class="text-xs">
                {{ item.label }}
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
      </div>

      <!-- 第二行：公式 / 图表 / 提示块等扩展插入 -->
      <div class="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
        <template v-for="(group, gi) in row2" :key="group.id">
          <div
            v-if="gi > 0"
            class="mx-0.5 hidden h-5 w-px shrink-0 bg-border sm:block"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-center gap-0.5">
            <Tooltip v-for="item in group.items" :key="item.id">
              <TooltipTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  :aria-label="item.label"
                  @click="item.run()"
                >
                  <component :is="item.icon" class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" :side-offset="4" class="text-xs">
                {{ item.label }}
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
      </div>
    </TooltipProvider>
  </div>
</template>
