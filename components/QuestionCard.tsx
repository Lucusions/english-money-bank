"use client";

import { useState } from "react";

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy: {
    label: "Easy",
    bg: "#dcfce7",
    color: "#166534",
  },
  medium: {
    label: "Medium",
    bg: "#fef3c7",
    color: "#92400e",
  },
  hard: {
    label: "Hard",
    bg: "#fee2e2",
    color: "#991b1b",
  },
};

export default function QuestionCard({ question }: { question: any }) {
  const [selected, setSelected] = useState<string | null>(null);

  const answered = selected !== null;

  const handleSelect = (id: string) => {
    if (!answered) {
      setSelected(id);
    }
  };

  const isCorrectAnswer = answered
    ? question.options.find((o: any) => o.id === selected)?.is_correct === true
    : null;

  const getOptionStyle = (optId: string, isCorrect: boolean | undefined) => {
    if (!answered) {
      return {
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
      };
    }

    if (isCorrect) {
      return {
        border: "1px solid #22c55e",
        background: "#f0fdf4",
        color: "#166534",
      };
    }

    if (optId === selected && !isCorrect) {
      return {
        border: "1px solid #ef4444",
        background: "#fef2f2",
        color: "#991b1b",
      };
    }

    return {
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      color: "#9ca3af",
    };
  };

  const difficulty = difficultyMap[question.difficulty] || {
    label: question.difficulty || "Unknown",
    bg: "#e5e7eb",
    color: "#374151",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
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
        <div
          style={{
            flex: 1,
            minWidth: "240px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Question
          </div>

          <div
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              color: "#111827",
              fontWeight: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {question.body}
          </div>
        </div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            background: difficulty.bg,
            color: difficulty.color,
            fontSize: "12px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {difficulty.label}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {question.options.map((opt: any, index: number) => {
          const style = getOptionStyle(opt.id, opt.is_correct);

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              style={{
                ...style,
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: "14px",
                cursor: answered ? "default" : "pointer",
                fontSize: "15px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontWeight: 700, marginRight: "8px" }}>
                {String.fromCharCode(65 + index)}.
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          style={{
            borderRadius: "14px",
            padding: "12px 14px",
            background: isCorrectAnswer ? "#ecfdf5" : "#fef2f2",
            color: isCorrectAnswer ? "#166534" : "#991b1b",
            border: isCorrectAnswer
              ? "1px solid #bbf7d0"
              : "1px solid #fecaca",
            marginBottom: "14px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {isCorrectAnswer ? "✓ 答對了" : "✗ 答錯了"}

          {!isCorrectAnswer && question.explanation && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
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

      {question.tags && question.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {question.tags.map((tag: any) => (
            <span
              key={tag.id}
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}