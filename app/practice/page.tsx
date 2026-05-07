"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "../../components/HomeButton";
import AuthButton from "../../components/AuthButton";
import QuestionTagSelector from "../../components/QuestionTagSelector";

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

const DIFF_LABEL: Record<string, string> = {
  easy: "簡單", medium: "中等", hard: "困難",
};
const DIFF_COLOR: Record<string, string> = {
  easy: "#059669", medium: "#b45309", hard: "#dc2626",
};
const DIFF_BG: Record<string, string> = {
  easy: "#ecfdf5", medium: "#fffbeb", hard: "#fef2f2",
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
          background: "#faf8f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-body)",
          padding: "20px",
        }}
      >
        <AuthButton />
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8e4df",
            borderRadius: "20px",
            padding: "52px 40px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(30, 42, 74, 0.07)",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#f0ede8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "22px",
              color: "#8896a4",
            }}
          >
            ?
          </div>
          <p
            style={{
              color: "#1a1f2e",
              fontSize: "17px",
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            尚無練習題目
          </p>
          <p style={{ color: "#8896a4", fontSize: "14px", margin: "0 0 28px", lineHeight: 1.65 }}>
            請先設定練習內容再開始。
          </p>
          <button
            onClick={() => router.push("/practice-builder")}
            style={{
              padding: "13px 32px",
              borderRadius: "10px",
              border: "none",
              background: "#1e2a4a",
              color: "#ffffff",
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
      borderRadius: "12px",
      fontSize: "15px",
      lineHeight: 1.6,
      boxSizing: "border-box",
      transition: "border-color 0.12s, background 0.12s",
    };

    if (!isAnswered) {
      const hovered = hoveredOpt === opt.id;
      return {
        ...base,
        border: hovered ? "1.5px solid #4a5872" : "1px solid #e8e4df",
        background: hovered ? "#f7f8fa" : "#ffffff",
        color: "#1a1f2e",
        cursor: "pointer",
      };
    }

    if (opt.id === selectedId && opt.is_correct) {
      return {
        ...base,
        border: "2px solid #6ee7b7",
        background: "#ecfdf5",
        color: "#065f46",
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
        border: "2px solid #6ee7b7",
        background: "#ecfdf5",
        color: "#065f46",
        cursor: "default",
      };
    }

    return {
      ...base,
      border: "1px solid #e8e4df",
      background: "#faf8f5",
      color: "#b4bec8",
      opacity: 0.55,
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
    const scoreColor =
      pct >= 80 ? "#059669" : pct >= 60 ? "#c9a84c" : "#dc2626";
    const scoreBg =
      pct >= 80 ? "#ecfdf5" : pct >= 60 ? "#fdf8ee" : "#fef2f2";
    const scoreBorder =
      pct >= 80 ? "#6ee7b7" : pct >= 60 ? "#f5e6c8" : "#fca5a5";

    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          padding: "52px 20px 96px",
          fontFamily: "var(--font-body)",
        }}
      >
        <AuthButton />
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>

          {/* Score card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "48px 36px",
              border: "1px solid #e8e4df",
              boxShadow: "0 6px 24px rgba(30, 42, 74, 0.09)",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {/* Big score circle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: scoreBg,
                border: `3px solid ${scoreBorder}`,
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: scoreColor,
                }}
              >
                {pct}%
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "26px",
                fontWeight: 700,
                color: "#1e2a4a",
                margin: "0 0 12px",
              }}
            >
              練習完成
            </h1>
            <p style={{ color: "#4a5568", fontSize: "16px", margin: "0 0 4px" }}>
              答對{" "}
              <strong style={{ color: "#1e2a4a", fontSize: "20px", fontFamily: "var(--font-display)" }}>
                {correctCount}
              </strong>{" "}
              / {total} 題
            </p>
            <p style={{ color: "#b4bec8", fontSize: "13px", margin: "0 0 32px" }}>
              正確率 {pct}%
            </p>
            <button
              onClick={() => router.push("/practice-builder")}
              onMouseEnter={() => setRestartHovered(true)}
              onMouseLeave={() => setRestartHovered(false)}
              style={{
                padding: "13px 36px",
                borderRadius: "10px",
                border: "none",
                background: restartHovered ? "#2d3f6e" : "#1e2a4a",
                color: "#ffffff",
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
          <div style={{ display: "grid", gap: "8px" }}>
            {questions.map((q, i) => {
              const selId = answers[i];
              const correct = selId && q.options.find((o) => o.id === selId)?.is_correct;
              return (
                <div
                  key={q.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    border: `1px solid ${correct ? "#6ee7b7" : "#fca5a5"}`,
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: "2px",
                      color: correct ? "#059669" : "#dc2626",
                    }}
                  >
                    {correct ? "✓" : "✗"}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#4a5568",
                      lineHeight: 1.65,
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
        background: "#faf8f5",
        padding: "36px 20px 96px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        <HomeButton />
        <AuthButton />

        {/* Progress */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#4a5568" }}>
              第 {idx + 1} 題
            </span>
            <span style={{ fontSize: "13px", color: "#8896a4" }}>
              {answeredCount} / {total} 已答
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "#e8e4df",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "4px",
                background: "#1e2a4a",
                borderRadius: "2px",
                width: `${((idx + 1) / total) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            border: "1px solid #e8e4df",
            boxShadow: "0 4px 16px rgba(30, 42, 74, 0.07)",
            marginBottom: "16px",
          }}
        >
          {current.difficulty && DIFF_LABEL[current.difficulty] && (
            <span
              style={{
                display: "inline-block",
                background: DIFF_BG[current.difficulty] ?? "#f7f8fa",
                color: DIFF_COLOR[current.difficulty] ?? "#4a5568",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "999px",
                marginBottom: "16px",
                letterSpacing: "0.04em",
              }}
            >
              {DIFF_LABEL[current.difficulty]}
            </span>
          )}

          <p
            style={{
              margin: "0 0 24px",
              fontSize: "17px",
              color: "#1a1f2e",
              lineHeight: 1.75,
              fontWeight: 600,
            }}
          >
            {current.body}
          </p>

          <div style={{ display: "grid", gap: "9px" }}>
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
                      <span style={{ fontWeight: 700, flexShrink: 0, minWidth: "18px", color: "inherit" }}>
                        {opt.label}.
                      </span>
                    )}
                    <span style={{ flex: 1 }}>{opt.text}</span>
                    {icon && (
                      <span style={{ flexShrink: 0, fontWeight: 700, fontSize: "15px" }}>
                        {icon}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div
              style={{
                marginTop: "20px",
                padding: "13px 16px",
                borderRadius: "10px",
                background: current.options.find((o) => o.id === selectedId)?.is_correct
                  ? "#ecfdf5"
                  : "#fef2f2",
                color: current.options.find((o) => o.id === selectedId)?.is_correct
                  ? "#065f46"
                  : "#dc2626",
                fontSize: "14px",
                fontWeight: 600,
                border: current.options.find((o) => o.id === selectedId)?.is_correct
                  ? "1px solid #6ee7b7"
                  : "1px solid #fca5a5",
              }}
            >
              {current.options.find((o) => o.id === selectedId)?.is_correct
                ? "✓ 答對了！"
                : "✗ 答錯了，正確答案已標示"}
            </div>
          )}

          <QuestionTagSelector questionId={current.id} />
        </div>

        {/* Next / Finish */}
        {isAnswered && (
          <button
            onClick={handleNext}
            onMouseEnter={() => setNextHovered(true)}
            onMouseLeave={() => setNextHovered(false)}
            style={{
              display: "block",
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: nextHovered ? "#2d3f6e" : "#1e2a4a",
              color: "#ffffff",
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
