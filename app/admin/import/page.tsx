'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    try {
      setLoading(true)
      setStatus('匯入中...')

      const parsed = JSON.parse(json)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('✅ 匯入成功')
      } else {
        setStatus('❌ 匯入失敗')
      }
    } catch (err) {
      console.error(err)
      setStatus('❌ 匯入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: 20,
        minHeight: '100vh',
        background: 'black',
        color: 'white'
      }}
    >
      <h1>題庫匯入</h1>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={20}
        cols={80}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <button onClick={handleImport} disabled={loading}>
        {loading ? '匯入中...' : '匯入'}
      </button>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  )
}