import { sanitizeTitle } from '@md/shared/utils/basicHelpers'
import { downloadFile } from '@md/shared/utils/fileHelpers'
import { waitForPreviewReady } from '@/lib/preview/preview-ready'
import { getHtmlContent } from './html-content'
import { getStylesToAdd, SHARE_SHELL_VARS_CSS } from './share-styles'

/**
 * Export preview as a Word-compatible .doc (HTML package).
 * Opens correctly in Microsoft Word / WPS without extra native deps.
 */
export async function exportWord(title: string = `untitled`) {
  await waitForPreviewReady()
  const htmlStr = getHtmlContent({ staticLayout: true })
  const stylesToAdd = await getStylesToAdd()
  const safeTitle = sanitizeTitle(title)

  const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>${SHARE_SHELL_VARS_CSS}</style>
  ${stylesToAdd}
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; line-height: 1.75; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${htmlStr}
</body>
</html>`

  downloadFile(fullHtml, `${safeTitle}.doc`, `application/msword`)
}
