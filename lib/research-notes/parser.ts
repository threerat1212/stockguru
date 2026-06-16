import type { ResearchNote, ResearchSource } from './types'

const FRONTMATTER = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/

function parseScalar(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function parseStringArray(value: string): string[] {
  const inline = value.trim()
  if (!inline) return []
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return inline
      .slice(1, -1)
      .split(',')
      .map((item) => parseScalar(item))
      .filter(Boolean)
  }
  return inline.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseSources(value: string): ResearchSource[] {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '[]') return []
  if (!trimmed.includes('title:')) return []
  return trimmed
    .split(/\n(?=-\s+)/)
    .map((block) => {
      const title = block.match(/title:\s*(.+)/)?.[1] ?? ''
      const url = block.match(/url:\s*(.+)/)?.[1] ?? undefined
      const accessedAt = block.match(/accessedAt:\s*(.+)/)?.[1] ?? undefined
      const note = block.match(/note:\s*(.+)/)?.[1] ?? undefined
      return {
        title: parseScalar(title),
        url: url ? parseScalar(url) : undefined,
        accessedAt: accessedAt ? parseScalar(accessedAt) : undefined,
        note: note ? parseScalar(note) : undefined,
      }
    })
    .filter((source) => source.title)
}

function parseFrontmatter(raw: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const lines = raw.split('\n')
  let currentKey = ''

  for (const line of lines) {
    if (!line.trim()) continue
    if (/^\S.*:\s*/.test(line)) {
      const [key, ...rest] = line.split(':')
      currentKey = key.trim()
      fields[currentKey] = rest.join(':').trim()
    } else if (currentKey && line.startsWith('  ')) {
      fields[currentKey] += `\n${line.trimStart()}`
    }
  }

  return fields
}

export function parseResearchNote(markdown: string, fallbackSlug: string): ResearchNote {
  const match = markdown.match(FRONTMATTER)
  if (!match) {
    throw new Error(`Research note is missing frontmatter: ${fallbackSlug}`)
  }

  const fields = parseFrontmatter(match[1])
  const title = fields.title ? parseScalar(fields.title) : fallbackSlug
  const slug = fields.slug ? parseScalar(fields.slug) : fallbackSlug
  const status = (fields.status ? parseScalar(fields.status) : 'draft') as ResearchNote['status']

  return {
    title,
    slug,
    status: ['draft', 'review', 'published', 'archived'].includes(status) ? status : 'draft',
    summary: fields.summary ? parseScalar(fields.summary) : undefined,
    snapshotAt: fields.snapshotAt ? parseScalar(fields.snapshotAt) : undefined,
    snapshotIntervalMinutes: fields.snapshotIntervalMinutes ? Number(fields.snapshotIntervalMinutes) as ResearchNote['snapshotIntervalMinutes'] : undefined,
    sourceType: fields.sourceType ? parseScalar(fields.sourceType) : undefined,
    symbols: parseStringArray(fields.symbols ?? ''),
    tags: parseStringArray(fields.tags ?? ''),
    sources: parseSources(fields.sources ?? ''),
    aiAssisted: fields.aiAssisted ? fields.aiAssisted.trim().toLowerCase() === 'true' : false,
    confidence: fields.confidence ? (parseScalar(fields.confidence) as ResearchNote['confidence']) : undefined,
    updatedAt: fields.updatedAt ? parseScalar(fields.updatedAt) : undefined,
    publishedAt: fields.publishedAt ? parseScalar(fields.publishedAt) : undefined,
    content: match[2].trim(),
  }
}
