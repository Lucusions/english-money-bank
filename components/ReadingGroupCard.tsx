"use client";

import { useState } from "react";

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy: { label: "Easy", bg: "#dcfce7", color: "#166534" },
  medium: { label: "Medium", bg: "#fef3c7", color: "#92400e" },
  hard: { label: "Hard", bg: "#fee2e2", color: "#991b1b" },
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

function parsePassage(body: string): { passage: string; questionBody: string; hasMarkers: boolean } {
  const passageMarker = "[PASSAGE]";
  const questionMarker = "[QUESTION]";

  const passageIdx = body.indexOf(passageMarker);
  const questionIdx = body.indexOf(questionMarker);

  if (passageIdx !== -1 && questionIdx !== -1 && passageIdx < questionIdx) {
    const passage = body.slice(passageIdx + passageMarker.length, questionIdx).trim();
    const questionBody = body.slice(questionIdx + questionMarker.length).trim();
    return { passage, questionBody, hasMarkers: true };
  }

  return { passage: body, questionBody: body, hasMarkers: false };
}

function QuestionItem({ question, index }: { question: Question; index: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;

  const isCorrectAnswer = answered
    ? question.options.find((o) => o.id === selected)?.is_correct === true
    : null;

  const getOptionStyle = (optId: string, isCorrect: boolean) => {
    if (!answered) {
      return { border: "1px solid #e5e7eb", background: "#ffffff", color: "#111827" };
    }
    if (isCorrect) {
      return { border: "1px solid #22c55e", background: "#f0fdf4", color: "#166534" };
    }
    if (optId === selected && !isCorrect) {
      return { border: "1px solid #ef4444", background: "#fef2f2", color: "#991b1b" };
    }
    return { border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af" };
  };

  const difficulty = difficultyMap[question.difficulty] || {
    label: question.difficulty || "Unknown",
    bg: "#e5e7eb",
    color: "#374151",
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: "6px",
            }}
          >
            Question {index + 1}
          </div>
          <div
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "#111827",
              fontWeight: 600,
              whiteSpace: "pre-wrap" as const,
            }}
          >
            {question.body}
          </div>
        </div>
        <div
          style={{
            padding: "5px 9px",
            borderRadius: "999px",
            background: difficulty.bg,
            color: difficulty.color,
            fontSize: "12px",
            fontWeight: 700,
            whiteSpace: "nowrap" as const,
          }}
        >
          {difficulty.label}
        </div>
      </div>

      <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
        {question.options.map((opt, i) => {
          const style = getOptionStyle(opt.id, opt.is_correct);
          return (
            <button
              key={opt.id}
              onClick={() => { if (!answered) setSelected(opt.id); }}
              disabled={answered}
              style={{
                ...style,
                width: "100%",
                textAlign: "left" as const,
                padding: "12px 14px",
                borderRadius: "10px",
                cursor: answered ? "default" : "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontWeight: 700, marginRight: "8px" }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          style={{
            borderRadius: "10px",
            padding: "10px 12px",
            background: isCorrectAnswer ? "#ecfdf5" : "#fef2f2",
            color: isCorrectAnswer ? "#166534" : "#991b1b",
            border: isCorrectAnswer ? "1px solid #bbf7d0" : "1px solid #fecaca",
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
                lineHeight: 1.6,
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
  const sorted = [...questions].sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0));
  const firstQ = sorted[0];
  const groupTitle = firstQ?.group_title;

  const { passage, questionBody, hasMarkers } = parsePassage(firstQ?.body ?? "");

  const displayQuestions = sorted.map((q, i) => {
    if (i === 0 && hasMarkers) {
      return { ...q, body: questionBody };
    }
    return q;
  });

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      {groupTitle && (
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: "999px",
              letterSpacing: "0.04em",
            }}
          >
            閱讀題組：{groupTitle}
          </span>
        </div>
      )}

      <div
        style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "14px",
          padding: "18px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#0369a1",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            marginBottom: "10px",
          }}
        >
          閱讀文章
        </div>
        <div
          style={{
            fontSize: "15px",
            lineHeight: 1.85,
            color: "#1e3a5f",
            whiteSpace: "pre-wrap" as const,
          }}
        >
          {passage}
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        {displayQuestions.map((q, i) => (
          <QuestionItem key={q.id} question={q} index={i} />
        ))}
      </div>
    </div>
  );
}
