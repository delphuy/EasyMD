import type { IConfigOption } from '@md/shared/types'

type Translate = (key: string) => string

/** 图床列表：本地插入优先，其余为国内图床 */
export const UPLOAD_HOST_VALUES = [
  `local`,
  `gitee`,
  `aliOSS`,
  `qiniu`,
  `txCOS`,
  `upyun`,
  `mp`,
  `minio`,
  `default`,
  `formCustom`,
] as const

export type UploadHostValue = typeof UPLOAD_HOST_VALUES[number]

export function getUploadHostLabel(t: Translate, value: string): string {
  const key = `upload.hosts.${value}`
  const translated = t(key)
  return translated !== key ? translated : value
}

export function createLocalizedUploadHostOptions(t: Translate): IConfigOption<UploadHostValue>[] {
  return UPLOAD_HOST_VALUES.map(value => ({
    value,
    label: getUploadHostLabel(t, value),
    desc: ``,
  }))
}

export function useLocalizedUploadHostOptions() {
  const { t, locale } = useI18n()

  return computed(() => {
    void locale.value
    return createLocalizedUploadHostOptions(t)
  })
}
