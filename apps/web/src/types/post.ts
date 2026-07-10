export interface PostHistory {
  datetime: string
  content: string
}

export interface Post {
  id: string
  title: string
  content: string
  history: PostHistory[]
  createDatetime: Date
  updateDatetime: Date
  parentId?: string | null
  collapsed?: boolean
  /** Absolute/normalized filesystem path when opened from disk; null for in-app drafts */
  path?: string | null
  /** True when content differs from last disk open/save */
  dirty?: boolean
}

export interface PostItemDragState {
  dragSourceId: string | null
  dropTargetId: string | null
  setDragSourceId: (id: string | null) => void
  setDropTargetId: (id: string | null) => void
  handleDrop: (targetId: string | null) => void
  handleDragEnd: () => void
}

export interface PostItemSelectState {
  isSelectMode: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
}

export interface PostItemActions {
  startRenamePost: (id: string) => void
  openHistoryDialog: (id: string) => void
  startDelPost: (id: string) => void
  openAddPostDialog: (parentId: string) => void
}

export interface PostItemProps {
  parentId: string | null
  sortedPosts: Post[]
  actions: PostItemActions
  drag: PostItemDragState
  select?: PostItemSelectState
}
