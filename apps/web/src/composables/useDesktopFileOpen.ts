/**
 * Wire Tauri file-association / second-instance opens into the document list.
 *
 * Registers `open-file` first, then drains cold-start pending paths so no
 * association event is lost between pull and listen.
 */
export async function setupDesktopFileOpen(
  openPaths: (paths: string[]) => Promise<void>,
): Promise<void> {
  if (typeof window === `undefined`)
    return

  const w = window as Window & {
    isTauri?: boolean
    __TAURI__?: unknown
    __TAURI_INTERNALS__?: unknown
  }
  const isTauri = Boolean(w.isTauri === true || w.__TAURI__ || w.__TAURI_INTERNALS__)
  if (!isTauri)
    return

  try {
    const [{ listen }, { invoke }] = await Promise.all([
      import(`@tauri-apps/api/event`),
      import(`@tauri-apps/api/core`),
    ])

    await listen<string | string[]>(`open-file`, (event) => {
      const payload = event.payload
      const paths = Array.isArray(payload) ? payload : [payload]
      const cleaned = paths.filter((p): p is string => typeof p === `string` && p.length > 0)
      if (cleaned.length)
        void openPaths(cleaned)
    })

    const pending = await invoke<string[]>(`take_pending_files`).catch(() => [] as string[])
    if (pending?.length)
      await openPaths(pending)
  }
  catch (error) {
    console.error(`[desktop] failed to setup file open bridge:`, error)
  }
}
