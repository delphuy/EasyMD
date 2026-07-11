<script setup lang="ts">
import type { GenericObject } from 'vee-validate'
import { UploadCloud } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { useLocalizedUploadHostOptions } from '@/composables/useLocalizedUploadHosts'
import { validateImageFile } from '@/lib/upload/validate-image'
import { store } from '@/storage'
import { useUIStore } from '@/stores/ui'

const emit = defineEmits([`uploadImage`])

const { t } = useI18n()

const uiStore = useUIStore()
const { enableImageReupload } = storeToRefs(uiStore)
const { toggleImageReupload } = uiStore

// gitee
const giteeSchema = computed(() => toTypedSchema(yup.object({
  repo: yup.string().required(t(`upload.validation.giteeRepoRequired`)),
  branch: yup.string().optional(),
  accessToken: yup.string().required(t(`upload.validation.giteeTokenRequired`)),
})))

const giteeConfig = store.reactive(`giteeConfig`, { repo: ``, branch: ``, accessToken: `` })

async function giteeSubmit(formValues: GenericObject) {
  Object.assign(giteeConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// 阿里云
const aliOSSSchema = computed(() => toTypedSchema(yup.object({
  accessKeyId: yup.string().required(t(`upload.validation.accessKeyIdRequired`)),
  accessKeySecret: yup.string().required(t(`upload.validation.accessKeySecretRequired`)),
  bucket: yup.string().required(t(`upload.validation.bucketRequired`)),
  region: yup.string().required(t(`upload.validation.regionRequired`)),
  useSSL: yup.boolean().required(),
  cdnHost: yup.string().optional(),
  path: yup.string().optional(),
})))

const aliOSSConfig = store.reactive(`aliOSSConfig`, {
  accessKeyId: ``,
  accessKeySecret: ``,
  bucket: ``,
  region: ``,
  useSSL: true,
  cdnHost: ``,
  path: ``,
})

async function aliOSSSubmit(formValues: GenericObject) {
  Object.assign(aliOSSConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// 腾讯云
const txCOSSchema = computed(() => toTypedSchema(yup.object({
  secretId: yup.string().required(t(`upload.validation.secretIdRequired`)),
  secretKey: yup.string().required(t(`upload.validation.secretKeyRequired`)),
  bucket: yup.string().required(t(`upload.validation.bucketRequired`)),
  region: yup.string().required(t(`upload.validation.regionRequired`)),
  cdnHost: yup.string().optional(),
  path: yup.string().optional(),
})))

const txCOSConfig = store.reactive(`txCOSConfig`, {
  secretId: ``,
  secretKey: ``,
  bucket: ``,
  region: ``,
  cdnHost: ``,
  path: ``,
})

async function txCOSSubmit(formValues: GenericObject) {
  Object.assign(txCOSConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// 七牛云
const qiniuSchema = computed(() => toTypedSchema(yup.object({
  accessKey: yup.string().required(t(`upload.validation.accessKeyRequired`)),
  secretKey: yup.string().required(t(`upload.validation.secretKeyRequired`)),
  bucket: yup.string().required(t(`upload.validation.bucketRequired`)),
  domain: yup.string().required(t(`upload.validation.domainRequired`)),
  region: yup.string().optional(),
  path: yup.string().optional(),
})))

const qiniuConfig = store.reactive(`qiniuConfig`, {
  accessKey: ``,
  secretKey: ``,
  bucket: ``,
  domain: ``,
  region: ``,
  path: ``,
})

async function qiniuSubmit(formValues: GenericObject) {
  Object.assign(qiniuConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// MinIO
const minioOSSSchema = computed(() => toTypedSchema(yup.object({
  endpoint: yup.string().required(t(`upload.validation.endpointRequired`)),
  port: yup.string().optional(),
  useSSL: yup.boolean().required(),
  bucket: yup.string().required(t(`upload.validation.bucketRequired`)),
  accessKey: yup.string().required(t(`upload.validation.accessKeyRequired`)),
  secretKey: yup.string().required(t(`upload.validation.secretKeyRequired`)),
})))

const minioOSSConfig = store.reactive(`minioConfig`, {
  endpoint: ``,
  port: ``,
  useSSL: true,
  bucket: ``,
  accessKey: ``,
  secretKey: ``,
})

async function minioOSSSubmit(formValues: GenericObject) {
  Object.assign(minioOSSConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// 公众号
// 当前是否为网页（http/https 协议）
const isWebsite = window.location.protocol.startsWith(`http`)

// Cloudflare Workers 环境
const isCfWorkers = import.meta.env.CF_WORKERS === `1`

// 插件模式运行（如 chrome-extension://）
const isPluginMode = !isWebsite

// 是否需要填写 proxyOrigin（只在 非插件 且 非CF页面 时需要）
const isProxyRequired = computed(() => {
  return !isPluginMode && !isCfWorkers
})

const mpPlaceholder = computed(() => {
  if (isProxyRequired.value) {
    return t(`upload.placeholders.proxyExample`)
  }
  return t(`upload.placeholders.proxyOptional`)
})
const mpSchema = computed(() =>
  toTypedSchema(yup.object({
    proxyOrigin: isProxyRequired.value
      ? yup.string().required(t(`upload.validation.proxyRequired`))
      : yup.string().optional(),
    appID: yup.string().required(t(`upload.validation.appIdRequired`)),
    appsecret: yup.string().required(t(`upload.validation.appSecretRequired`)),
  })),
)

const mpConfig = store.reactive(`mpConfig`, {
  proxyOrigin: ``,
  appID: ``,
  appsecret: ``,
})

async function mpSubmit(formValues: GenericObject) {
  Object.assign(mpConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

// 又拍云
const upyunSchema = computed(() => toTypedSchema(
  yup.object({
    bucket: yup.string().required(t(`upload.validation.bucketRequired`)),
    operator: yup.string().required(t(`upload.validation.operatorRequired`)),
    password: yup.string().required(t(`upload.validation.passwordRequired`)),
    domain: yup.string().required(t(`upload.validation.cdnDomainRequired`)),
    path: yup.string().optional(),
  }),
))

const upyunConfig = store.reactive(`upyunConfig`, {
  bucket: ``,
  operator: ``,
  password: ``,
  domain: ``,
  path: ``,
})

async function upyunSubmit(formValues: GenericObject) {
  Object.assign(upyunConfig.value, formValues)
  toast.success(t(`common.saveSuccess`))
}

const uploadHostOptions = useLocalizedUploadHostOptions()

const imgHost = store.reactive(`imgHost`, `local`)
const useCompression = store.reactive(`useCompression`, false)
const activeName = ref(`upload`)
const isLocalHost = computed(() => (imgHost.value || `local`) === `local`)

// 历史国外图床配置迁移为本地插入
const allowedHosts = computed(() => new Set(uploadHostOptions.value.map(o => o.value)))
if (!allowedHosts.value.has(imgHost.value as any)) {
  imgHost.value = `local`
}
watch(uploadHostOptions, () => {
  if (!allowedHosts.value.has(imgHost.value as any))
    imgHost.value = `local`
})

async function changeImgHost() {
  toast.success(t(`upload.hostSwitched`))
}

async function changeCompression() {
  // reactive 会自动保存，不需要手动操作
}

async function beforeImageUpload(file: File): Promise<File | false> {
  const checkResult = validateImageFile(file, t)
  if (!checkResult.ok) {
    toast.error(checkResult.msg)
    return false
  }

  const imgHostValue = imgHost.value || `local`
  // 本地插入无需图床配置
  if (imgHostValue === `local`)
    return checkResult.file

  const config = await store.get(`${imgHostValue}Config`)
  const isValidHost = imgHostValue === `default` || config
  if (!isValidHost) {
    const hostLabel = uploadHostOptions.value.find(option => option.value === imgHostValue)?.label ?? imgHostValue
    toast.error(t(`upload.configureHostFirst`, { host: hostLabel }))
    return false
  }
  return checkResult.file
}

const dragover = ref(false)

const { open, reset, onChange } = useFileDialog({
  accept: `image/*`,
  multiple: true,
})

async function processPickedFiles(files: File[] | FileList | null | undefined) {
  if (!files)
    return
  const list = Array.from(files)
  for (const file of list) {
    const validated = await beforeImageUpload(file)
    if (validated)
      emitUploads(validated)
  }
}

onChange(async (files) => {
  await processPickedFiles(files)
  reset()
})

/** 选图：本地插入走带真实路径的桌面对话框；云图床用系统文件选择 */
async function handlePickImages() {
  if (isLocalHost.value) {
    try {
      const { pickLocalImages } = await import(`@/lib/documents/pick-local-images`)
      const files = await pickLocalImages()
      await processPickedFiles(files)
      return
    }
    catch (error) {
      console.warn(`[upload-dialog] local pick failed, fallback`, error)
    }
  }
  open()
}

async function onDrop(e: DragEvent) {
  dragover.value = false
  e.stopPropagation()
  await processPickedFiles(e.dataTransfer?.files)
}
const isUploading = ref(false)
const imageUrl = ref(``)

function emitUploads(file: File) {
  isUploading.value = true
  const cleanup = (_url: string, data: string) => {
    isUploading.value = false
    if (data) {
      imageUrl.value = `data:image/png;base64,${data}`
      setTimeout(() => {
        imageUrl.value = ``
      }, 1000)
    }
  }
  emit(`uploadImage`, file, cleanup, true)
}

function onTabScroll(e: WheelEvent) {
  if (e.deltaY !== 0) {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.scrollLeft += e.deltaY
  }
}
</script>

<template>
  <Dialog v-model:open="uiStore.isShowUploadImgDialog">
    <DialogContent class="md:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" @pointer-down-outside="ev => ev.preventDefault()">
      <DialogHeader>
        <DialogTitle>{{ t('upload.title') }}</DialogTitle>
      </DialogHeader>
      <Tabs v-model="activeName" class="w-full md:w-full flex flex-col flex-1 overflow-hidden">
        <TabsList
          class="flex w-full justify-start overflow-x-auto flex-nowrap gap-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          @wheel="onTabScroll"
        >
          <TabsTrigger value="upload" class="text-xs md:text-sm whitespace-nowrap">
            {{ t('upload.selectUpload') }}
          </TabsTrigger>
          <TabsTrigger
            v-for="item in uploadHostOptions.filter(item => item.value !== 'default')"
            :key="item.value"
            :value="item.value"
            class="text-xs md:text-sm whitespace-nowrap"
          >
            {{ item.label }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Select v-model="imgHost" class="my-4" @update:model-value="changeImgHost">
            <SelectTrigger>
              <SelectValue :placeholder="t('upload.selectHostPlaceholder')" />
            </SelectTrigger>
            <SelectContent class="max-h-64 md:max-h-96">
              <SelectItem
                v-for="item in uploadHostOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <p v-if="isLocalHost" class="my-3 text-xs text-muted-foreground">
            {{ t('upload.localInsertHint') }}
          </p>

          <div v-else class="space-y-3 my-4">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm">
                {{ t('upload.enableCompression') }}
              </span>
              <Switch
                v-model="useCompression"
                name="UseCompression"
                @update:model-value="changeCompression"
              />
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm">
                {{ t('upload.autoReuploadOnPaste') }}
              </span>
              <Switch
                v-model="enableImageReupload"
                name="EnableImageReupload"
                @update:model-value="toggleImageReupload"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ t('upload.autoReuploadMdHint') }}
            </p>
          </div>

          <div
            class="bg-clip-padding mt-4 h-50 relative flex flex-col cursor-pointer items-center justify-evenly border-2 rounded border-dashed transition-colors hover:border-gray-700 hover:bg-gray-400/50 dark:hover:border-gray-200 dark:hover:bg-gray-500/50"
            :class="{
              'border-gray-700 bg-gray-400/50 dark:border-gray-200 dark:bg-gray-500/50': dragover,
            }"
            @click="handlePickImages()"
            @drop.prevent="onDrop"
            @dragover.prevent="dragover = true"
            @dragleave.prevent="dragover = false"
          >
            <Progress v-if="isUploading" indeterminate class="absolute left-0 right-0 rounded-none" style="top: -24px; height: 2px;" />
            <UploadCloud class="size-16 md:size-20" />
            <p class="text-center text-sm md:text-base px-4">
              {{ t('upload.dragOrClick') }}
              <strong>{{ isLocalHost ? t('menu.image') : t('upload.clickToUpload') }}</strong>
            </p>
            <div v-if="imageUrl" class="absolute left-0 right-0 h-full w-full flex items-center justify-center bg-white dark:bg-black">
              <img :src="imageUrl" class="max-h-40 object-contain">
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gitee" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="giteeSchema" :initial-values="giteeConfig" class="flex flex-col flex-1 overflow-hidden" @submit="giteeSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="repo">
                <FormItem :label="t('upload.labels.giteeRepo')" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.giteeRepo')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="branch">
                <FormItem :label="t('upload.labels.branch')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.branch')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="accessToken">
                <FormItem label="Token" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    type="password"
                    :placeholder="t('upload.placeholders.token')"
                  />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="https://gitee.com/profile/personal_access_tokens"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.giteeToken') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="aliOSS" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="aliOSSSchema" :initial-values="aliOSSConfig" class="flex flex-col flex-1 overflow-hidden" @submit="aliOSSSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="accessKeyId">
                <FormItem label="AccessKey ID" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.accessKeyId')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="accessKeySecret">
                <FormItem label="AccessKey Secret" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    type="password"
                    :placeholder="t('upload.placeholders.accessKeySecret')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="bucket">
                <FormItem label="Bucket" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.bucket')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="region">
                <FormItem :label="t('upload.labels.bucketRegion')" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.ossRegion')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="useSSL" type="boolean">
                <FormItem label="UseSSL" required :error="errorMessage">
                  <Switch
                    :model-value="field.value"
                    :name="field.name"
                    @update:model-value="field.onChange"
                    @blur="field.onBlur"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="cdnHost">
                <FormItem :label="t('upload.labels.customCdn')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.cdnHost')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="path">
                <FormItem :label="t('upload.labels.storagePath')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.storagePath')"
                  />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="https://help.aliyun.com/document_detail/31883.html"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.aliOSS') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="txCOS" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="txCOSSchema" :initial-values="txCOSConfig" class="flex flex-col flex-1 overflow-hidden" @submit="txCOSSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="secretId">
                <FormItem label="SecretId" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.secretId')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="secretKey">
                <FormItem label="SecretKey" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    type="password"
                    :placeholder="t('upload.placeholders.secretKey')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="bucket">
                <FormItem label="Bucket" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.cosBucket')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="region">
                <FormItem :label="t('upload.labels.bucketRegion')" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.cosRegion')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="cdnHost">
                <FormItem :label="t('upload.labels.customCdn')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.cdnHost')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="path">
                <FormItem :label="t('upload.labels.storagePath')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.storagePathRoot')"
                  />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="https://cloud.tencent.com/document/product/436/38484"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.txCOS') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="qiniu" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="qiniuSchema" :initial-values="qiniuConfig" class="flex flex-col flex-1 overflow-hidden" @submit="qiniuSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="accessKey">
                <FormItem label="AccessKey" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.qiniuAccessKey')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="secretKey">
                <FormItem label="SecretKey" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    type="password"
                    :placeholder="t('upload.placeholders.qiniuSecretKey')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="bucket">
                <FormItem label="Bucket" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.qiniuBucket')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="domain">
                <FormItem :label="t('upload.labels.domain')" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.qiniuDomain')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="region">
                <FormItem :label="t('upload.labels.storageRegion')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.qiniuRegion')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="path">
                <FormItem :label="t('upload.labels.storagePath')" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.storagePath')"
                  />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="https://developer.qiniu.com/kodo"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.qiniu') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="minio" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="minioOSSSchema" :initial-values="minioOSSConfig" class="flex flex-col flex-1 overflow-hidden" @submit="minioOSSSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="endpoint">
                <FormItem label="Endpoint" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.minioEndpoint')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="port">
                <FormItem label="Port" :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    type="number"
                    :placeholder="t('upload.placeholders.minioPort')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="useSSL" type="boolean">
                <FormItem label="UseSSL" required :error="errorMessage">
                  <Switch
                    :model-value="field.value"
                    :name="field.name"
                    @update:model-value="field.onChange"
                    @blur="field.onBlur"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="bucket">
                <FormItem label="Bucket" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.bucket')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="accessKey">
                <FormItem label="AccessKey" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.minioAccessKey')" />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="secretKey">
                <FormItem label="SecretKey" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.minioSecretKey')" />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="http://docs.minio.org.cn/docs/master/minio-client-complete-guide"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.minio') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="mp" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="mpSchema" :initial-values="mpConfig" class="flex flex-col flex-1 overflow-hidden" @submit="mpSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <!-- 只有在需要代理时才显示 proxyOrigin 字段 -->
              <Field
                v-if="isProxyRequired"
                v-slot="{ field, errorMessage }"
                name="proxyOrigin"
              >
                <FormItem :label="t('upload.labels.proxyDomain')" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="mpPlaceholder"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="appID">
                <FormItem label="appID" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.appId')"
                  />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="appsecret">
                <FormItem label="appsecret" required :error="errorMessage">
                  <Input
                    v-bind="field"
                    v-model="field.value"
                    :placeholder="t('upload.placeholders.appSecret')"
                  />
                </FormItem>
              </Field>

              <FormItem>
                <div class="flex flex-col items-start">
                  <Button
                    variant="link"
                    class="p-0 h-auto text-left whitespace-normal"
                    as="a"
                    href="https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Getting_Started_Guide.html"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {{ t('upload.help.mpDevMode') }}
                  </Button>
                  <Button
                    variant="link"
                    class="p-0 h-auto text-left whitespace-normal"
                    as="a"
                    href="https://md-pages.doocs.org/tutorial/"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {{ t('upload.help.mpExtension') }}
                  </Button>
                </div>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="upyun" class="flex-1 flex flex-col overflow-hidden">
          <Form :validation-schema="upyunSchema" :initial-values="upyunConfig" class="flex flex-col flex-1 overflow-hidden" @submit="upyunSubmit">
            <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Field v-slot="{ field, errorMessage }" name="bucket">
                <FormItem label="Bucket" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.upyunBucket')" class="w-full min-w-0 md:min-w-[350px]" />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="operator">
                <FormItem :label="t('upload.labels.operator')" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.upyunOperator')" />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="password">
                <FormItem :label="t('upload.labels.operatorPassword')" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" type="password" :placeholder="t('upload.placeholders.r2SecretKey')" />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="domain">
                <FormItem :label="t('upload.labels.domain')" required :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.upyunDomain')" />
                </FormItem>
              </Field>

              <Field v-slot="{ field, errorMessage }" name="path">
                <FormItem :label="t('upload.labels.storagePath')" :error="errorMessage">
                  <Input v-bind="field" v-model="field.value" :placeholder="t('upload.placeholders.storagePath')" />
                </FormItem>
              </Field>

              <FormItem>
                <Button
                  variant="link"
                  class="p-0 h-auto text-left whitespace-normal"
                  as="a"
                  href="https://help.upyun.com/"
                  target="_blank" rel="noopener noreferrer"
                >
                  {{ t('upload.help.upyun') }}
                </Button>
              </FormItem>
            </div>

            <DialogFooter class="p-1">
              <Button type="submit">
                {{ t('upload.saveConfig') }}
              </Button>
            </DialogFooter>
          </Form>
        </TabsContent>

        <TabsContent value="formCustom" class="flex-1 flex flex-col overflow-hidden">
          <CustomUploadForm />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
