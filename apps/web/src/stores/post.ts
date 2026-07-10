import type { Post } from '@/types/post'
import { debounce } from 'es-toolkit'
import { v4 as uuidv4 } from 'uuid'
import DEFAULT_CONTENT from '@/assets/example/markdown.md?raw'
import { formatLocalDateTime, t } from '@/i18n/translate'
import { openDocumentsFromPathsCore } from '@/lib/documents/document-list'
import { documentRepo, store } from '@/storage'
import { addPrefix } from '@/storage/prefix'
import { useEditorStore } from '@/stores/editor'

export type { Post } from '@/types/post'

function createDefaultPost(): Post {
  return {
    id: uuidv4(),
    title: t('store.post.defaultTitle'),
    content: DEFAULT_CONTENT,
    history: [
      { datetime: formatLocalDateTime(), content: DEFAULT_CONTENT },
    ],
    createDatetime: new Date(),
    updateDatetime: new Date(),
    path: null,
    dirty: false,
  }
}

function normalizePosts(raw: Post[]): Post[] {
  return raw.map((post, index) => {
    const now = Date.now()
    return {
      ...post,
      id: post.id ?? uuidv4(),
      createDatetime: new Date(post.createDatetime ?? now + index),
      updateDatetime: new Date(post.updateDatetime ?? now + index),
      history: post.history ?? [],
      path: post.path ?? null,
      dirty: post.dirty ?? false,
    }
  })
}

function postSignature(post: Post): string {
  return `${post.id}:${post.title}:${post.content.length}:${post.updateDatetime}:${post.parentId ?? ``}:${post.history?.length ?? 0}:${post.collapsed ? 1 : 0}:${post.path ?? ``}:${post.dirty ? 1 : 0}`
}

/**
 * 文章管理 Store
 * 负责管理文章列表、当前文章、文章 CRUD 操作
 */
export const usePostStore = defineStore(`post`, () => {
  // 每次启动固定打开样例 Markdown，不恢复上次文档（会话内编辑仍会正常保存）
  const posts = ref<Post[]>([createDefaultPost()])

  const currentPostId = store.reactive(addPrefix(`current_post_id`), ``)
  const sortMode = store.reactive(addPrefix(`sort_mode`), `create-old-new`)

  let persistReady = false

  const persistAll = debounce(async (snapshot: Post[]) => {
    await documentRepo.saveAll(snapshot)
  }, 500)

  const persistOne = debounce(async (post: Post) => {
    await documentRepo.savePost(post)
  }, 500)

  /** 删除等关键操作立即落盘，避免防抖未完成时刷新导致数据回弹 */
  async function persistImmediately(): Promise<void> {
    persistAll.cancel()
    persistOne.cancel()
    await documentRepo.saveAll([...posts.value])
  }

  watch(
    posts,
    (value, oldValue) => {
      if (!persistReady)
        return

      if (!oldValue || value.length !== oldValue.length) {
        persistAll([...value])
        return
      }

      const changed: Post[] = []
      for (const post of value) {
        const prev = oldValue.find(p => p.id === post.id)
        if (!prev || postSignature(prev) !== postSignature(post))
          changed.push(post)
      }

      if (changed.length === 1)
        persistOne(changed[0])
      else if (changed.length > 0)
        persistAll([...value])
    },
    { deep: true },
  )

  onBeforeMount(() => {
    // 冷启动：覆盖内存与本地缓存，避免 IndexedDB 里的上次内容回弹
    const sample = createDefaultPost()
    posts.value = [sample]
    currentPostId.value = sample.id
    void documentRepo.saveAll(posts.value)

    persistReady = true
  })

  onMounted(() => {
    const editorStore = useEditorStore()

    const flushToDisk = () => {
      editorStore.flushContentToPostStore()
      persistAll.flush()
      persistOne.flush()
      void persistImmediately()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === `hidden`)
        flushToDisk()
    }

    window.addEventListener(`pagehide`, flushToDisk)
    window.addEventListener(`beforeunload`, flushToDisk)
    document.addEventListener(`visibilitychange`, onVisibilityChange)
    onUnmounted(() => {
      window.removeEventListener(`pagehide`, flushToDisk)
      window.removeEventListener(`beforeunload`, flushToDisk)
      document.removeEventListener(`visibilitychange`, onVisibilityChange)
    })
  })

  function replacePosts(nextPosts: Post[]) {
    persistAll.cancel()
    persistOne.cancel()
    posts.value = normalizePosts(nextPosts)
    void documentRepo.saveAll(posts.value)
  }

  async function replacePostsAndPersist(nextPosts: Post[]): Promise<void> {
    persistAll.cancel()
    persistOne.cancel()
    posts.value = normalizePosts(nextPosts)
    await documentRepo.saveAll(posts.value)
  }

  const findIndexById = (id: string) => posts.value.findIndex(p => p.id === id)

  const currentPostIndex = computed<number>({
    get: () => findIndexById(currentPostId.value),
    set: (idx) => {
      if (idx >= 0 && idx < posts.value.length)
        currentPostId.value = posts.value[idx].id
    },
  })

  const getPostById = (id: string) => posts.value.find(p => p.id === id)
  const currentPost = computed(() => getPostById(currentPostId.value))

  const addPost = (title: string, parentId: string | null = null) => {
    const newPost: Post = {
      id: uuidv4(),
      title,
      content: `# ${title}`,
      history: [
        { datetime: formatLocalDateTime(), content: `# ${title}` },
      ],
      createDatetime: new Date(),
      updateDatetime: new Date(),
      parentId,
      path: null,
      dirty: false,
    }
    posts.value.push(newPost)
    currentPostId.value = newPost.id
  }

  const renamePost = (id: string, title: string) => {
    const post = getPostById(id)
    if (post) {
      post.title = title
      post.updateDatetime = new Date()
    }
  }

  const delPost = (id: string, recursive: boolean = false) => {
    const post = getPostById(id)
    if (!post)
      return

    if (recursive) {
      const getChildIds = (parentId: string): string[] => {
        const children = posts.value.filter(p => p.parentId === parentId)
        return children.reduce((acc, child) => {
          return acc.concat(child.id, getChildIds(child.id))
        }, [] as string[])
      }

      const allIdsToDelete = [id, ...getChildIds(id)]
      allIdsToDelete.forEach((toDelId) => {
        const idx = findIndexById(toDelId)
        if (idx !== -1)
          posts.value.splice(idx, 1)
      })

      if (!posts.value.some(p => p.id === currentPostId.value))
        currentPostId.value = posts.value[Math.max(0, posts.value.length - 1)]?.id ?? ``

      persistImmediately()
      return
    }

    const newParentId = post.parentId ?? null
    posts.value.forEach((p) => {
      if (p.parentId === id) {
        p.parentId = newParentId
        p.updateDatetime = new Date()
      }
    })

    const idx = findIndexById(id)
    if (idx === -1)
      return

    posts.value.splice(idx, 1)
    currentPostId.value = posts.value[Math.min(idx, posts.value.length - 1)]?.id ?? ``
    persistImmediately()
  }

  const updatePostParentId = (postId: string, parentId: string | null) => {
    const post = getPostById(postId)
    if (post) {
      post.parentId = parentId
      post.updateDatetime = new Date()
    }
  }

  const updatePostContent = (id: string, content: string) => {
    const post = getPostById(id)
    if (post) {
      if (post.content === content)
        return
      post.content = content
      post.updateDatetime = new Date()
      post.dirty = true
    }
  }

  const markPostDirty = (id: string, dirty = true) => {
    const post = getPostById(id)
    if (post)
      post.dirty = dirty
  }

  /**
   * Batch open markdown files by path using @md/desktop-fs upsert.
   * All reads + upserts finish before posts/current selection update once
   * (so the editor + renderer only re-sync once for the final selection).
   */
  async function openDocumentsFromPaths(
    paths: string[],
    readFile: (path: string) => Promise<string>,
  ): Promise<{ opened: number, lastId: string | null }> {
    if (!paths.length)
      return { opened: 0, lastId: null }

    const { posts: nextPosts, lastIndex, opened } = await openDocumentsFromPathsCore(
      posts.value,
      paths,
      readFile,
    )

    persistAll.cancel()
    persistOne.cancel()
    posts.value = normalizePosts(nextPosts)

    const lastId = lastIndex >= 0 ? posts.value[lastIndex]?.id ?? null : null
    if (lastId)
      currentPostId.value = lastId

    void documentRepo.saveAll(posts.value)
    return { opened, lastId }
  }

  const collapseAllPosts = () => {
    posts.value.forEach((post) => {
      post.collapsed = true
    })
  }

  const expandAllPosts = () => {
    posts.value.forEach((post) => {
      post.collapsed = false
    })
  }

  return {
    posts,
    currentPostId,
    sortMode,
    currentPostIndex,
    currentPost,
    getPostById,
    findIndexById,
    addPost,
    renamePost,
    delPost,
    updatePostParentId,
    updatePostContent,
    markPostDirty,
    openDocumentsFromPaths,
    collapseAllPosts,
    expandAllPosts,
    replacePosts,
    replacePostsAndPersist,
    persistImmediately,
  }
})
