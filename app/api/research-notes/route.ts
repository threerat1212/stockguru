import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { parseResearchNote } from '@/lib/research-notes/parser'
import type { ResearchNote } from '@/lib/research-notes/types'
import { apiSuccess, apiError } from '@/lib/api/response'

const ARTICLES_DIR = join(process.cwd(), 'knowledge', 'articles')

async function readMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) return readMarkdownFiles(fullPath)
        return entry.name.endsWith('.md') ? [fullPath] : []
      })
    )
    return files.flat()
  } catch {
    return []
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const files = await readMarkdownFiles(ARTICLES_DIR)
    const notes: ResearchNote[] = []

    for (const file of files) {
      if (file.endsWith('README.md')) continue
      const markdown = await readFile(file, 'utf8')
      notes.push(parseResearchNote(markdown, file.replace(ARTICLES_DIR, '').replace(/\.md$/, '').replace(/^[\\/]/, '')))
    }

    return apiSuccess(notes.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')))
  } catch (error) {
    return apiError((error as Error).message, 500)
  }
}
