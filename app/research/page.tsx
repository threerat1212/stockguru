'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils/format'

interface ResearchSource {
  title: string
  url?: string
  accessedAt?: string
  note?: string
}

interface ResearchNote {
  title: string
  slug: string
  status: 'draft' | 'review' | 'published' | 'archived'
  summary?: string
  snapshotAt?: string
  snapshotIntervalMinutes?: number
  sourceType?: string
  symbols: string[]
  tags: string[]
  sources: ResearchSource[]
  aiAssisted: boolean
  confidence?: 'low' | 'medium' | 'high'
  updatedAt?: string
  publishedAt?: string
}

export default function ResearchNotesPage() {
  const query = useQuery<ResearchNote[]>({
    queryKey: ['research-notes'],
    queryFn: async () => {
      const res = await fetch('/api/research-notes')
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to load research notes')
      return json.data ?? []
    },
  })

  const notes = query.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">Research Memory</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">
            บทความและโน้ตวิจัยจาก market snapshot ทุก 30–60 นาที พร้อม provenance
          </p>
        </div>
        <Link href="/news" className="text-xs text-brand-primary hover:text-emerald-300">ดู News Brief</Link>
      </div>

      <div className="rounded-xl border border-brand-warning/25 bg-brand-warning/10 p-4 text-sm text-brand-warning">
        ข้อมูลตลาดใน Research Memory เป็น near-real-time snapshot ไม่ใช่อัปเดตแบบ real-time
      </div>

      {query.isLoading ? (
        <Card><CardHeader><CardTitle>กำลังโหลด research notes...</CardTitle></CardHeader></Card>
      ) : notes.length === 0 ? (
        <Card><CardHeader><CardTitle>ยังไม่มีบทความวิจัย</CardTitle></CardHeader></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.slug}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-brand-text-primary">{note.title}</h2>
                    {note.summary && <p className="mt-1 text-sm text-brand-text-secondary">{note.summary}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={note.status === 'published' ? 'success' : note.status === 'review' ? 'warning' : 'info'} size="sm">
                        {note.status}
                      </Badge>
                      {note.snapshotIntervalMinutes && (
                        <Badge variant="info" size="sm">{note.snapshotIntervalMinutes}m snapshot</Badge>
                      )}
                      {note.aiAssisted && <Badge variant="info" size="sm">AI-assisted</Badge>}
                      {note.confidence && <Badge variant={note.confidence === 'high' ? 'success' : note.confidence === 'medium' ? 'warning' : 'danger'} size="sm">{note.confidence}</Badge>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-brand-text-secondary">
                      {note.symbols.map((symbol) => <span key={symbol} className="rounded-md bg-brand-bg-secondary px-2 py-1">{symbol}</span>)}
                      {note.tags.map((tag) => <span key={tag} className="rounded-md bg-brand-bg-secondary px-2 py-1">#{tag}</span>)}
                    </div>
                    {note.updatedAt && (
                      <p className="mt-3 text-[11px] text-brand-text-muted">
                        อัปเดต {timeAgo(note.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
