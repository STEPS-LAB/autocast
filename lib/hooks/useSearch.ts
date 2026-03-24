'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SearchResult } from '@/types'
import { POPULAR_SEARCHES } from '@/lib/data/seed'

const RECENT_KEY = 'autocast-recent-searches'
const MAX_RECENT = 5

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored) as string[])
    } catch {
      // ignore
    }
  }, [])

  const addRecent = useCallback((query: string) => {
    setRecent(prev => {
      const next = [query, ...prev.filter(q => q !== query)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
    localStorage.removeItem(RECENT_KEY)
  }, [])

  return { recent, addRecent, clearRecent }
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { recent, addRecent, clearRecent } = useRecentSearches()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const payload = await res.json() as { results?: SearchResult[] }
        setResults((payload.results ?? []).slice(0, 6))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const submit = useCallback((q: string) => {
    if (q.trim()) addRecent(q.trim())
    setOpen(false)
  }, [addRecent])

  return {
    query,
    setQuery,
    results,
    loading,
    open,
    setOpen,
    recent,
    clearRecent,
    popularSearches: POPULAR_SEARCHES,
    submit,
  }
}
