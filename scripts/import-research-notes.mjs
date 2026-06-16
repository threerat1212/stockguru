import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const articlesDir = join(process.cwd(), 'knowledge', 'articles')

async function readMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) return readMarkdownFiles(fullPath)
    return entry.name.endsWith('.md') && !entry.name.endsWith('README.md') ? [fullPath] : []
  }))
  return nested.flat()
}

function parseScalar(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function parseArray(value) {
  const inline = value.trim()
  if (!inline) return []
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return inline.slice(1, -1).split(',').map((item) => parseScalar(item)).filter(Boolean)
  }
  return inline.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseFrontmatter(raw) {
  const fields = {}
  let currentKey = ''
  for (const line of raw.split('\n')) {
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

async function main() {
  const files = await readMarkdownFiles(articlesDir)
  const notes = []

  for (const file of files) {
    const markdown = await readFile(file, 'utf8')
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
    if (!match) {
      console.warn(`[research-notes] skip missing frontmatter: ${file}`)
      continue
    }

    const fields = parseFrontmatter(match[1])
    const slug = fields.slug ? parseScalar(fields.slug) : file.replace(articlesDir, '').replace(/\.md$/, '').replace(/^[\\/]/, '')
    notes.push({
      title: fields.title ? parseScalar(fields.title) : slug,
      slug,
      status: fields.status ? parseScalar(fields.status) : 'draft',
      snapshotAt: fields.snapshotAt ? parseScalar(fields.snapshotAt) : undefined,
      snapshotIntervalMinutes: fields.snapshotIntervalMinutes ? Number(fields.snapshotIntervalMinutes) : undefined,
      symbols: parseArray(fields.symbols ?? ''),
      tags: parseArray(fields.tags ?? ''),
      aiAssisted: fields.aiAssisted ? fields.aiAssisted.trim().toLowerCase() === 'true' : false,
      updatedAt: fields.updatedAt,
      sourceCount: fields.sources?.trim() ? fields.sources.split(/\n(?=-\s+)/).filter((line) => line.includes('title:')).length : 0,
    })
  }

  console.log(JSON.stringify({ count: notes.length, notes }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
