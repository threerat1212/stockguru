import { describe, expect, it } from 'vitest'
import { parseResearchNote } from '../../lib/research-notes/parser'

describe('research note parser', () => {
  it('parses frontmatter and content', () => {
    const note = parseResearchNote(`---
title: "PTT dividend watch"
slug: "ptt-dividend-watch"
status: "review"
snapshotAt: "2026-06-15T10:30:00+07:00"
snapshotIntervalMinutes: 60
sourceType: "market_snapshot"
symbols: ["PTT.BK"]
tags: ["energy", "dividend"]
sources:
  - title: "SET announcement"
    url: "https://example.com"
    accessedAt: "2026-06-15T10:30:00+07:00"
aiAssisted: true
confidence: "medium"
---
เนื้อหาบทความ
`, 'fallback')

    expect(note.title).toBe('PTT dividend watch')
    expect(note.slug).toBe('ptt-dividend-watch')
    expect(note.status).toBe('review')
    expect(note.snapshotIntervalMinutes).toBe(60)
    expect(note.symbols).toEqual(['PTT.BK'])
    expect(note.tags).toEqual(['energy', 'dividend'])
    expect(note.sources).toEqual([{ title: 'SET announcement', url: 'https://example.com', accessedAt: '2026-06-15T10:30:00+07:00', note: undefined }])
    expect(note.aiAssisted).toBe(true)
    expect(note.confidence).toBe('medium')
    expect(note.content).toBe('เนื้อหาบทความ')
  })
})
