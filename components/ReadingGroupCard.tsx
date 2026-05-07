"use client";

import { useState } from "react";

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy:   { label: "Easy",   bg: "#dcfce7", color: "#166534" },
  medium: { label: "Medium", bg: "#fef3c7", color: "#92400e" },
  hard:   { label: "Hard",   bg: "#fee2e2", color: "#991b1b" },
};

interface Option {
  id: string;
  text: string;
  sort_order: number;
  is_correct: boolean;
}

interface Question {
  id: string;
  body: string;
  type: string;
  difficulty: string;
  group_id: string | null;
  group_title: string | null;
  group_order: number | null;
  options: Option[];
  tags: any[];
  explanation?: string;
}

function parsePassage(body: string): {
  passage: string;
  questionBody: string;
  hasMarkers: boolean;
} {
  const P = "[PASSAGE]";
  const Q = "[QUESTION]";
  const pi = body.indexOf(P);
  const qi = body.indexOf(Q);

  if (pi !== -1 && qi !== -1 && pi < qi) {
    return {
      passage: body.slice(pi + P.length, qi).trim(),
      questionBody: body.slice(qi + Q.length).trim(),
      hasMarkers: true,
    };
  }
  return { passage: body, questionBody: body, hasMarkers: false };
}

function QuestionItem({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;

  const isCorrectAnswer = answered
    ? question.options.find((o) => o.id === selected)?.is_correct === true
    : null;

  const getOptionStyle = (optId: string, isCorrect: boolean) => {
    if (!answered) {
      return { border: "1px solid #e8e4df", background: "#ffffff", color: "#1a1f2e" };
    }
    if (isCorrect) {
      return { border: "1px solid #6ee7b7", background: "#ecfdf5", color: "#065f46" };
    }
    if (optId === selected && !isCorrect) {
      return { border: "1px solid #fca5a5", background: "#fef2f2", color: "#991b1b" };
    }
    return { border: "1px solid #e8e4df", background: "#f7f8fa", color: "#b4bec8" };
  };

  const difficulty = difficultyMap[question.difficulty] || {
    label: question.difficulty || "—",
    bg: "#e5e7eb",
    color: "#374151",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e4df",
        borderRadius: "14px",
        padding: "22px",
      }}
    >
      {/* Question header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#8896a4",
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}
          >
            Question {index + 1}
          </div>
          <div
            style={{
              fontSize: "16px",
              lineHeight: 1.75,
              color: "#1a1f2e",
              fontWeight: 600,
              whiteSpace: "pre-wrap" as const,
            }}
          >
            {question.body}
          </div>
        </div>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "999px",
            background: difficulty.bg,
            color: difficulty.color,
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap" as const,
            flexShrink: 0,
            letterSpacing: "0.03em",
          }}
        >
          {difficulty.label}
        </span>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
        {question.options.map((opt, i) => {
          const optStyle = getOptionStyle(opt.id, opt.is_correct);
          return (
            <button
              key={opt.id}
              onClick={() => { if (!answered) setSelected(opt.id); }}
              disabled={answered}
              style={{
                ...optStyle,
                width: "100%",
                textAlign: "left" as const,
                padding: "12px 16px",
                borderRadius: "10px",
                cursor: answered ? "default" : "pointer",
                fontSize: "14px",
                lineHeight: 1.55,
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!answered) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f7f8fa";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#8896a4";
                }
              }}
              onMouseLeave={(e) => {
                if (!answered) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8e4df";
                }
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  marginRight: "8px",
                  color: answered ? undefined : "#4a5568",
                }}
              >
                {String.fromCharCode(65 + i)}.
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div
          style={{
            borderRadius: "10px",
            padding: "12px 14px",
            background: isCorrectAnswer ? "#ecfdf5" : "#fef2f2",
            color: isCorrectAnswer ? "#065f46" : "#991b1b",
            border: isCorrectAnswer ? "1px solid #6ee7b7" : "1px solid #fca5a5",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {isCorrectAnswer ? "✓ 答對了" : "✗ 答錯了"}
          {!isCorrectAnswer && question.explanation && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                fontWeight: 400,
                color: "#6b7280",
                lineHeight: 1.65,
              }}
            >
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReadingGroupCard({ questions }: { questions: Question[] }) {
  const sorted = [...questions].sort(
    (a, b) => (a.group_order ?? 0) - (b.group_order ?? 0)
  );
  const firstQ = sorted[0];
  const groupTitle = firstQ?.group_title;

  const { passage, questionBody, hasMarkers } = parsePassage(firstQ?.body ?? "");

  const displayQuestions = sorted.map((q, i) => {
    if (i === 0 && hasMarkers) return { ...q, body: questionBody };
    return q;
  });

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e4df",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(30, 42, 74, 0.09)",
      }}
    >
      {/* Card header strip */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e2a4a 0%, #2d3f6e 100%)",
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(201, 168, 76, 0.2)",
              border: "1px solid rgba(201, 168, 76, 0.4)",
              color: "#c9a84c",
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "999px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            閱讀題組
          </span>
          {groupTitle && (
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {groupTitle}
            </span>
          )}
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {sorted.length} 題
        </span>
      </div>

      <div style={{ padding: "28px" }}>
        {/* Passage – paper feeling */}
        <div
          style={{
            background: "#fdf8ee",
            border: "1px solid #f5e6c8",
            borderRadius: "16px",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          {/* Passage label bar */}
          <div
            style={{
              background: "#f5e6c8",
              padding: "9px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#a07030",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              閱讀文章
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(160, 112, 48, 0.2)",
              }}
            />
          </div>

          {/* Passage text */}
          <div
            style={{
              padding: "22px 24px",
              fontSize: "15px",
              lineHeight: 1.9,
              color: "#2c2016",
              whiteSpace: "pre-wrap",
              fontFamily: "Georgia, var(--font-display), serif",
              letterSpacing: "0.01em",
            }}
          >
            {passage}
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: "grid", gap: "14px" }}>
          {displayQuestions.map((q, i) => (
            <QuestionItem key={q.id} question={q} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
