"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "../../components/HomeButton";

interface Option {
  id: string;
  label: string | null;
  text: string;
  is_correct: boolean;
  sort_order: number;
}

interface Question {
  id: string;
  body: string;
  difficulty: string;
  question_no: number | null;
  options: Option[];
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "困難",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#15803d",
  medium: "#b45309",
  hard: "#dc2626",
};

const DIFFICULTY_BG: Record<string, string> = {
  easy: "#f0fdf4",
  medium: "#fffbeb",
  hard: "#fef2f2",
};

export default function PracticePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [hoveredOpt, setHoveredOpt] = useState<string | null>(null);
  const [nextHovered, setNextHovered] = useState(false);
  const [restartHovered, setRestartHovered] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("practice_session");
      if (raw) setQuestions(JSON.parse(raw));
    } catch {}
  }, []);

  // ── Empty state ──
  if (questions.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <p
            style={{
              color: "#374151",
              fontSize: "16px",
              fontWeight: 500,
              margin: "0 0 6px",
            }}
          >
            沒有練習題目
          </p>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 24px" }}>
            請先設定練習內容再開始。
          </p>
          <button
            onClick={() => router.push("/practice-builder")}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            前往設定
          </button>
        </div>
      </main>
    );
  }

  const total = questions.length;
  const current = questions[idx];
  const selectedId = answers[idx];
  const isAnswered = selectedId !== undefined;
  const isLast = idx === total - 1;
  const answeredCount = Object.keys(answers).length;

  function selectOption(optId: string) {
    if (isAnswered) return;
    setAnswers((prev) => ({ ...prev, [idx]: optId }));
    setHoveredOpt(null);
  }

  function handleNext() {
    setNextHovered(false);
    if (isLast) {
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  }

  function optStyle(opt: Option): React.CSSProperties {
    const base: React.CSSProperties = {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "14px 18px",
      borderRadius: "10px",
      fontSize: "15px",
      lineHeight: 1.6,
      boxSizing: "border-box",
      transition: "border-color 0.1s, background 0.1s",
    };

    if (!isAnswered) {
      const hovered = hoveredOpt === opt.id;
      return {
        ...base,
        border: hovered ? "1.5px solid #93c5fd" : "1.5px solid #e5e7eb",
        background: hovered ? "#eff6ff" : "#fff",
        color: "#111827",
        cursor: "pointer",
      };
    }

    if (opt.id === selectedId && opt.is_correct) {
      return {
        ...base,
        border: "2px solid #86efac",
        background: "#f0fdf4",
        color: "#15803d",
        fontWeight: 600,
        cursor: "default",
      };
    }

    if (opt.id === selectedId && !opt.is_correct) {
      return {
        ...base,
        border: "2px solid #fca5a5",
        background: "#fef2f2",
        color: "#dc2626",
        fontWeight: 600,
        cursor: "default",
      };
    }

    if (opt.is_correct) {
      return {
        ...base,
        border: "2px solid #86efac",
        background: "#f0fdf4",
        color: "#15803d",
        cursor: "default",
      };
    }

    return {
      ...base,
      border: "1.5px solid #e5e7eb",
      background: "#fafafa",
      color: "#9ca3af",
      opacity: 0.5,
      cursor: "default",
    };
  }

  function optIcon(opt: Option): string | null {
    if (!isAnswered) return null;
    if (opt.id === selectedId && opt.is_correct) return "✓";
    if (opt.id === selectedId && !opt.is_correct) return "✗";
    if (opt.is_correct) return "✓";
    return null;
  }

  // ── Summary screen ──
  if (finished) {
    const correctCount = questions.filter((q, i) => {
      const selId = answers[i];
      return selId && q.options.find((o) => o.id === selId)?.is_correct;
    }).length;
    const pct = Math.round((correctCount / total) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚";

    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7fb",
          padding: "48px 20px 80px",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>

          {/* Score card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "40px 32px",
              boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>{emoji}</div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 10px",
              }}
            >
              練習完成！
            </h1>
            <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 6px" }}>
              答對{" "}
              <strong style={{ color: "#111827", fontSize: "20px" }}>
                {correctCount}
              </strong>{" "}
              / {total} 題
            </p>
            <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 28px" }}>
              正確率 {pct}%
            </p>
            <button
              onClick={() => router.push("/practice-builder")}
              onMouseEnter={() => setRestartHovered(true)}
              onMouseLeave={() => setRestartHovered(false)}
              style={{
                padding: "12px 32px",
                borderRadius: "10px",
                border: "none",
                background: restartHovered ? "#1d4ed8" : "#2563eb",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              再練一次
            </button>
          </div>

          {/* Per-question summary */}
          <div style={{ display: "grid", gap: "10px" }}>
            {questions.map((q, i) => {
              const selId = answers[i];
              const correct = selId && q.options.find((o) => o.id === selId)?.is_correct;
              return (
                <div
                  key={q.id}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    border: `1.5px solid ${correct ? "#bbf7d0" : "#fca5a5"}`,
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {correct ? "✅" : "❌"}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: 1.6,
                    }}
                  >
                    {q.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ── Main practice screen ──
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "32px 20px 80px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        <HomeButton />
        {/* Progress bar */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              第 {idx + 1} 題
            </span>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>
              {answeredCount} / {total} 已答
            </span>
          </div>
          <div
            style={{
              height: "5px",
              background: "#e5e7eb",
              borderRadius: "3px",
            }}
          >
            <div
              style={{
                height: "5px",
                background: "#2563eb",
                borderRadius: "3px",
                width: `${((idx + 1) / total) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
            marginBottom: "16px",
          }}
        >
          {/* Difficulty badge */}
          {current.difficulty && DIFFICULTY_LABEL[current.difficulty] && (
            <span
              style={{
                display: "inline-block",
                background: DIFFICULTY_BG[current.difficulty] ?? "#f9fafb",
                color: DIFFICULTY_COLOR[current.difficulty] ?? "#6b7280",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "999px",
                marginBottom: "14px",
                letterSpacing: "0.04em",
              }}
            >
              {DIFFICULTY_LABEL[current.difficulty]}
            </span>
          )}

          {/* Question body */}
          <p
            style={{
              margin: "0 0 22px",
              fontSize: "16px",
              color: "#111827",
              lineHeight: 1.75,
              fontWeight: 500,
            }}
          >
            {current.body}
          </p>

          {/* Options */}
          <div style={{ display: "grid", gap: "10px" }}>
            {(current.options ?? []).map((opt) => {
              const icon = optIcon(opt);
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(opt.id)}
                  onMouseEnter={() => !isAnswered && setHoveredOpt(opt.id)}
                  onMouseLeave={() => setHoveredOpt(null)}
                  style={optStyle(opt)}
                >
                  <span style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                    {opt.label && (
                      <span
                        style={{
                          fontWeight: 700,
                          flexShrink: 0,
                          minWidth: "18px",
                          color: "inherit",
                        }}
                      >
                        {opt.label}.
                      </span>
                    )}
                    <span style={{ flex: 1 }}>{opt.text}</span>
                    {icon && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: "16px",
                        }}
                      >
                        {icon}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Inline feedback */}
          {isAnswered && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: current.options.find((o) => o.id === selectedId)
                  ?.is_correct
                  ? "#f0fdf4"
                  : "#fef2f2",
                color: current.options.find((o) => o.id === selectedId)?.is_correct
                  ? "#15803d"
                  : "#dc2626",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {current.options.find((o) => o.id === selectedId)?.is_correct
                ? "✓ 答對了！"
                : "✗ 答錯了，正確答案已標示"}
            </div>
          )}
        </div>

        {/* Next / Finish button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            onMouseEnter={() => setNextHovered(true)}
            onMouseLeave={() => setNextHovered(false)}
            style={{
              display: "block",
              width: "100%",
              padding: "15px",
              borderRadius: "12px",
              border: "none",
              background: nextHovered ? "#1d4ed8" : "#2563eb",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.15s",
            }}
          >
            {isLast ? "查看成績 →" : "下一題 →"}
          </button>
        )}
      </div>
    </main>
  );
}
