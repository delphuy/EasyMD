import { copyFileSystemPath } from '@/lib/documents/file-path-map'

const VALID_IMAGE_SUFFIX = /\.(?:gif|pjp|jfif|jpe|pjpeg|jpe?g|png|webp)$/i
const VALID_IMAGE_MIME = /^image\/(?:gif|pjpeg|pjp|jpe|jfif|jpe?g|png|webp)$/i
const MAX_SIZE_MB = 10

type Translate = (key: string, params?: Record<string, unknown>) => string

function mimeToExtension(mime: string): string {
  const type = mime.toLowerCase().split(`;`)[0]?.trim() || ``
  if (type === `image/jpeg` || type === `image/jpg` || type === `image/pjpeg`)
    return `jpg`
  if (type === `image/png`)
    return `png`
  if (type === `image/gif`)
    return `gif`
  if (type === `image/webp`)
    return `webp`
  return `png`
}

/**
 * Ensure clipboard / paste files without a real name still pass extension checks
 * and produce a usable filename for storage.
 * Preserves desktop filesystem path across File reconstruction.
 */
export function normalizeImageFile(file: File): File {
  if (VALID_IMAGE_SUFFIX.test(file.name))
    return file

  if (file.type && VALID_IMAGE_MIME.test(file.type)) {
    const ext = mimeToExtension(file.type)
    const base = (file.name && file.name !== `image` ? file.name : `image`).replace(/\.[^.]+$/, ``) || `image`
    const next = new File([file], `${base}.${ext}`, {
      type: file.type,
      lastModified: file.lastModified,
    })
    copyFileSystemPath(file, next)
    return next
  }

  return file
}

export function validateImageFile(file: File, t: Translate): { ok: true, file: File } | { ok: false, msg: string } {
  const normalized = normalizeImageFile(file)
  const byExt = VALID_IMAGE_SUFFIX.test(normalized.name)
  const byMime = !!(normalized.type && VALID_IMAGE_MIME.test(normalized.type))

  if (!byExt && !byMime) {
    return { ok: false, msg: t(`upload.errors.invalidFormat`) }
  }

  if (normalized.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, msg: t(`upload.errors.tooLarge`, { maxSize: MAX_SIZE_MB }) }
  }

  return { ok: true, file: normalized }
}
