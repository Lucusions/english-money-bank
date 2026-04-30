'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Option = {
  id: string
  label: string | null
  text: string
  is_correct: boolean
  sort_order: number | null
}

type Question = {
  id: string
  question_no: number | null
  body: string
  type: string
  answer_text: string | null
  passage_id: string | null
  group_id: string | null
  option_set_id: string | null
  options?: Option[]
  passages?: {
    id: string
    content: string
  } | null
  option_sets?: {
    id: string
    title: string | null
    instruction: string | null
    option_set_items?: {
      id: string
      label: string | null
      text: string
      sort_order: number | null
    }[]
  } | null
}

type PaperItem = {
  id: string
  sort_order: number
  score: number | null
  paper_sections?: {
    id: string
    title: string
    section_type: string
    sort_order: number
  } | null
  questions: Question
}

export default function ExamPage() {
  const params = useParams()
  const paperId = params.paperId as string

  const [items, setItems] = useState<PaperItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExam()
  }, [paperId])

  async function fetchExam() {
    setLoading(true)

    const { data, error } = await supabase
      .from('paper_items')
      .select(`
        id,
        sort_order,
        score,
        paper_sections (
          id,
          title,
          section_type,
          sort_order
        ),
        questions (
          id,
          question_no,
          body,
          type,
          answer_text,
          passage_id,
          group_id,
          option_set_id,
          passages (
            id,
            content
          ),
          option_sets (
            id,
            title,
            instruction,
            option_set_items (
              id,
              label,
              text,
              sort_order
            )
          ),
          options (
            id,
            label,
            text,
            is_correct,
            sort_order
          )
        )
      `)
      .eq('paper_id', paperId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error(error)
      setItems([])
    } else {
      setItems((data || []) as PaperItem[])
    }

    setLoading(false)
  }

  const groupedItems = useMemo(() => {
    const map: Record<string, PaperItem[]> = {}

    for (const item of items) {
      const sectionTitle = item.paper_sections?.title || '其他題型'
      if (!map[sectionTitle]) map[sectionTitle] = []
      map[sectionTitle].push(item)
    }

    return map
  }, [items])

  const answeredCount = useMemo(() => {
    return items.filter((item) => {
      const ans = answers[item.questions.id]
      if (Array.isArray(ans)) return ans.length > 0
      return String(ans || '').trim() !== ''
    }).length
  }, [items, answers])

  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0

  function selectSingle(questionId: string, optionId: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function toggleMulti(questionId: string, optionId: string) {
    if (submitted) return

    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : []

      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]

      return { ...prev, [questionId]: next }
    })
  }

  function inputText(questionId: string, value: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function isCorrect(q: Question) {
    if (q.type === 'single_choice' || q.type === 'reading_choice') {
      const selected = answers[q.id]
      const correct = q.options?.find((o) => o.is_correct)
      return selected === correct?.id
    }

    if (q.type === 'multi_choice') {
      const selected = Array.isArray(answers[q.id])
        ? [...(answers[q.id] as string[])].sort()
        : []

      const correct =
        q.options
          ?.filter((o) => o.is_correct)
          .map((o) => o.id)
          .sort() || []

      return JSON.stringify(selected) === JSON.stringify(correct)
    }

    if (
      q.type === 'shared_option_fill' ||
      q.type === 'short_answer' ||
      q.type === 'translation'
    ) {
      const user = String(answers[q.id] || '').trim().toLowerCase()
      const correct = String(q.answer_text || '').trim().toLowerCase()
      return !!user && !!correct && user === correct
    }

    return false
  }

  const score = useMemo(() => {
    if (!submitted) return 0

    return items.reduce((sum, item) => {
      return sum + (isCorrect(item.questions) ? Number(item.score || 1) : 0)
    }, 0)
  }, [submitted, items, answers])

  const totalScore = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.score || 1), 0)
  }, [items])

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>載入考卷中...</div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brandRow}>
            <div style={styles.logoBox}>📝</div>
            <div>
              <h1 style={styles.title}>線上考卷</h1>
              <div style={styles.subtitle}>English Exam System</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSubmitted(true)}
          disabled={submitted || items.length === 0}
          style={{
            ...styles.submitTopButton,
            opacity: submitted ? 0.55 : 1,
            cursor: submitted ? 'default' : 'pointer'
          }}
        >
          交卷
        </button>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>題目導覽</div>

            {Object.entries(groupedItems).map(([sectionTitle, sectionItems]) => (
              <div key={sectionTitle} style={styles.sideSection}>
                <div style={styles.sideSectionHead}>
                  <span>{sectionTitle}</span>
                  <span style={styles.sideCount}>共 {sectionItems.length} 題</span>
                </div>

                <div style={styles.gridNav}>
                  {sectionItems.map((item, idx) => {
                    const q = item.questions
                    const ans = answers[q.id]
                    const done = Array.isArray(ans)
                      ? ans.length > 0
                      : String(ans || '').trim() !== ''

                    return (
                      <a
                        key={item.id}
                        href={`#q-${q.id}`}
                        style={{
                          ...styles.navNumber,
                          background: done ? '#2563eb' : '#ffffff',
                          color: done ? '#ffffff' : '#334155',
                          borderColor: done ? '#2563eb' : '#dbe3ef'
                        }}
                      >
                        {q.question_no || idx + 1}
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>作答進度</div>
            <div style={styles.progressLine}>
              <span>已作答</span>
              <b>{answeredCount} / {items.length}</b>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <div style={styles.progressText}>完成度 {progress}%</div>
          </div>
        </aside>

        <section style={styles.content}>
          {submitted && (
            <div style={styles.resultCard}>
              <div style={styles.resultTitle}>交卷完成</div>
              <div style={styles.resultScore}>得分：{score} / {totalScore}</div>
            </div>
          )}

          {Object.entries(groupedItems).map(([sectionTitle, sectionItems]) => (
            <section key={sectionTitle} style={styles.examSection}>
              <h2 style={styles.sectionTitle}>{sectionTitle}</h2>

              {sectionItems.map((item) => {
                const q = item.questions

                const options = [...(q.options || [])].sort(
                  (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
                )

                const optionSetItems =
                  q.option_sets?.option_set_items?.sort(
                    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
                  ) || []

                return (
                  <article key={item.id} id={`q-${q.id}`} style={styles.questionCard}>
                    {q.passages?.content && (
                      <div style={styles.passageBox}>
                        {q.passages.content}
                      </div>
                    )}

                    {optionSetItems.length > 0 && (
                      <div style={styles.optionSetBox}>
                        <div style={styles.optionSetTitle}>共用選項</div>
                        {optionSetItems.map((opt) => (
                          <div key={opt.id} style={styles.optionSetItem}>
                            ({opt.label}) {opt.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.questionHead}>
                      <div style={styles.questionNo}>
                        {q.question_no || item.sort_order + 1}
                      </div>
                      <div style={styles.questionText}>{q.body}</div>
                      <div style={styles.scorePill}>{Number(item.score || 1)} 分</div>
                    </div>

                    {(q.type === 'single_choice' || q.type === 'reading_choice') &&
                      options.map((opt) => {
                        const selected = answers[q.id] === opt.id
                        const showCorrect = submitted && opt.is_correct
                        const showWrong = submitted && selected && !opt.is_correct

                        return (
                          <div
                            key={opt.id}
                            onClick={() => selectSingle(q.id, opt.id)}
                            style={{
                              ...styles.choice,
                              borderColor: showCorrect
                                ? '#22c55e'
                                : showWrong
                                ? '#ef4444'
                                : selected
                                ? '#2563eb'
                                : '#dbe3ef',
                              background: showCorrect
                                ? '#ecfdf5'
                                : showWrong
                                ? '#fef2f2'
                                : selected
                                ? '#eff6ff'
                                : '#ffffff'
                            }}
                          >
                            <span style={styles.choiceLabel}>{opt.label}</span>
                            <span>{opt.text}</span>
                          </div>
                        )
                      })}

                    {q.type === 'multi_choice' &&
                      options.map((opt) => {
                        const selected = Array.isArray(answers[q.id])
                          ? (answers[q.id] as string[]).includes(opt.id)
                          : false

                        const showCorrect = submitted && opt.is_correct
                        const showWrong = submitted && selected && !opt.is_correct

                        return (
                          <label
                            key={opt.id}
                            style={{
                              ...styles.choice,
                              borderColor: showCorrect
                                ? '#22c55e'
                                : showWrong
                                ? '#ef4444'
                                : selected
                                ? '#2563eb'
                                : '#dbe3ef',
                              background: showCorrect
                                ? '#ecfdf5'
                                : showWrong
                                ? '#fef2f2'
                                : selected
                                ? '#eff6ff'
                                : '#ffffff'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={submitted}
                              onChange={() => toggleMulti(q.id, opt.id)}
                              style={{ marginRight: 12 }}
                            />
                            <span style={styles.choiceLabel}>{opt.label}</span>
                            <span>{opt.text}</span>
                          </label>
                        )
                      })}

                    {[
                      'shared_option_fill',
                      'short_answer',
                      'translation',
                      'essay'
                    ].includes(q.type) && (
                      <textarea
                        value={String(answers[q.id] || '')}
                        disabled={submitted}
                        onChange={(e) => inputText(q.id, e.target.value)}
                        placeholder="請輸入答案"
                        style={{
                          ...styles.textarea,
                          minHeight: q.type === 'essay' ? 180 : 80
                        }}
                      />
                    )}

                    {submitted && q.answer_text && (
                      <div style={styles.answerBox}>
                        參考答案：{q.answer_text}
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
          ))}

          {!submitted && items.length > 0 && (
            <button onClick={() => setSubmitted(true)} style={styles.bottomSubmit}>
              交卷
            </button>
          )}
        </section>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f8fc',
    color: '#0f172a',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#f5f8fc'
  },
  loadingCard: {
    background: '#fff',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 12px 30px rgba(15,23,42,.08)',
    color: '#0f172a',
    fontWeight: 700
  },
  header: {
    height: 112,
    padding: '0 38px',
    background:
      'linear-gradient(135deg, #071628 0%, #0f2a4d 55%, #123b72 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 18px 40px rgba(15,23,42,.18)'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    background: 'rgba(255,255,255,.14)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 28
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: '.02em'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#cbd5e1'
  },
  submitTopButton: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 16,
    boxShadow: '0 14px 30px rgba(37,99,235,.35)'
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: 28,
    padding: 28,
    maxWidth: 1280,
    margin: '0 auto'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    position: 'sticky',
    top: 24,
    alignSelf: 'start'
  },
  sideCard: {
    background: '#ffffff',
    borderRadius: 20,
    padding: 20,
    border: '1px solid #dbe3ef',
    boxShadow: '0 16px 36px rgba(15,23,42,.07)'
  },
  sideTitle: {
    fontSize: 17,
    fontWeight: 900,
    marginBottom: 14
  },
  sideSection: {
    paddingTop: 14,
    marginTop: 14,
    borderTop: '1px solid #eef2f7'
  },
  sideSectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 800,
    color: '#334155',
    marginBottom: 10
  },
  sideCount: {
    color: '#64748b',
    fontWeight: 700
  },
  gridNav: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8
  },
  navNumber: {
    height: 38,
    borderRadius: 10,
    border: '1px solid #dbe3ef',
    textDecoration: 'none',
    display: 'grid',
    placeItems: 'center',
    fontSize: 14,
    fontWeight: 800
  },
  progressLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#475569',
    marginBottom: 10
  },
  progressBar: {
    height: 10,
    background: '#e5eaf2',
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
    borderRadius: 999
  },
  progressText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
    fontWeight: 700
  },
  content: {
    minWidth: 0
  },
  resultCard: {
    background: '#ecfdf5',
    border: '1px solid #86efac',
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
    color: '#065f46'
  },
  resultTitle: {
    fontWeight: 900,
    fontSize: 18
  },
  resultScore: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 900
  },
  examSection: {
    marginBottom: 34
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 900,
    margin: '8px 0 18px',
    color: '#102033'
  },
  questionCard: {
    background: '#ffffff',
    border: '1px solid #dbe3ef',
    borderRadius: 22,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 16px 36px rgba(15,23,42,.07)'
  },
  passageBox: {
    background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
    border: '1px solid #c7dbff',
    padding: 20,
    borderRadius: 18,
    marginBottom: 22,
    lineHeight: 1.85,
    whiteSpace: 'pre-wrap',
    color: '#1e293b',
    fontSize: 16
  },
  optionSetBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    color: '#1e293b'
  },
  optionSetTitle: {
    fontWeight: 900,
    marginBottom: 8
  },
  optionSetItem: {
    lineHeight: 1.8
  },
  questionHead: {
    display: 'grid',
    gridTemplateColumns: '44px 1fr auto',
    alignItems: 'start',
    gap: 14,
    marginBottom: 18
  },
  questionNo: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    color: '#ffffff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900
  },
  questionText: {
    fontSize: 18,
    lineHeight: 1.7,
    fontWeight: 800,
    color: '#0f172a'
  },
  scorePill: {
    padding: '7px 12px',
    borderRadius: 999,
    background: '#eff6ff',
    color: '#2563eb',
    fontWeight: 900,
    fontSize: 13
  },
  choice: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '15px 16px',
    marginBottom: 10,
    borderRadius: 16,
    border: '1px solid #dbe3ef',
    cursor: 'pointer',
    transition: 'all .15s ease',
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 600
  },
  choiceLabel: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid #dbe3ef',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
    background: '#ffffff'
  },
  textarea: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    border: '1px solid #cbd5e1',
    fontSize: 16,
    lineHeight: 1.7,
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none'
  },
  answerBox: {
    marginTop: 14,
    padding: 12,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#9a3412',
    borderRadius: 14,
    fontWeight: 700
  },
  bottomSubmit: {
    padding: '16px 28px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 17,
    cursor: 'pointer',
    boxShadow: '0 14px 32px rgba(37,99,235,.3)',
    marginBottom: 40
  }
}