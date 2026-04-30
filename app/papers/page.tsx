'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Paper = {
  id: string
  title: string
  year: number | null
  source: string | null
  created_at: string
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])

  useEffect(() => {
    fetchPapers()
  }, [])

  async function fetchPapers() {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setPapers(data || [])
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        📄 考卷列表
      </h1>

      {papers.length === 0 && <div>目前沒有考卷</div>}

      {papers.map((paper) => (
        <div
          key={paper.id}
          style={{
            padding: 20,
            marginBottom: 20,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}
        >
          <h2>{paper.title}</h2>

          <div style={{ fontSize: 14, color: '#666' }}>
            年份：{paper.year || '—'} ｜ 來源：{paper.source || '—'}
          </div>

          <Link href={`/exam/${paper.id}`}>
            <button
              style={{
                marginTop: 10,
                padding: '10px 16px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              開始作答
            </button>
          </Link>
        </div>
      ))}
    </main>
  )
}