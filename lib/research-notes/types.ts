export type ResearchNoteStatus = 'draft' | 'review' | 'published' | 'archived'
export type ResearchSnapshotInterval = 30 | 60 | 120 | 240 | 1440

export interface ResearchSource {
  title: string
  url?: string
  accessedAt?: string
  note?: string
}

export interface ResearchNote {
  title: string
  slug: string
  status: ResearchNoteStatus
  summary?: string
  snapshotAt?: string
  snapshotIntervalMinutes?: ResearchSnapshotInterval
  sourceType?: string
  symbols: string[]
  tags: string[]
  sources: ResearchSource[]
  aiAssisted: boolean
  confidence?: 'low' | 'medium' | 'high'
  updatedAt?: string
  publishedAt?: string
  content: string
}
