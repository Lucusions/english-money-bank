"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "../../components/HomeButton";
import AuthButton from "../../components/AuthButton";

type ExamType = "cee" | "csat" | "toeic";
type CountOption = 5 | 10 | 20;

const EXAM_TYPES: { key: ExamType; label: string }[] = [
  { key: "cee",  label: "會考" },
  { key: "csat", label: "學測" },
  { key: "toeic", label: "TOEIC" },
];

const COUNTS: CountOption[] = [5, 10, 20];

const CARD_STYLE = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "22px 24px",
  border: "1px solid #e8e4df",
  boxShadow: "0 2px 8px rgba(30, 42, 74, 0.06)",
  marginBottom: "14px",
};

export default function PracticeBuilderPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("cee");
  const [count, setCount] = useState<CountOption>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startHovered, setStartHovered] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || "無法取得題目，請稍後再試。");
        return;
      }
      sessionStorage.setItem("practice_session", JSON.stringify(result.questions));
      router.push("/practice");
    } catch {
      setError("網路錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        padding: "52px 20px 96px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <HomeButton />
        <AuthButton />

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#fdf8ee",
              color: "#c9a84c",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "999px",
              marginBottom: "14px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "1px solid #f5e6c8",
            }}
          >
            練習模式
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              color: "#1e2a4a",
              margin: "0 0 10px",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
            }}
          >
            設定練習內容
          </h1>
          <p
            style={{
              color: "#8896a4",
              fontSize: "15px",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            選擇考試類型與題目數量，即時生成隨機練習題。
          </p>
        </div>

        {/* Exam type */}
        <div style={CARD_STYLE}>
          <SectionLabel label="考試類型" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {EXAM_TYPES.map((item) => {
              const sel = examType === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setExamType(item.key)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: sel ? "none" : "1px solid #e8e4df",
                    background: sel ? "#1e2a4a" : "#ffffff",
                    color: sel ? "#ffffff" : "#4a5568",
                    fontSize: "14px",
                    fontWeight: sel ? 600 : 400,
                    cursor: "pointer",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#b4bec8", lineHeight: 1.5 }}>
            考試類型篩選即將推出，目前從全部題庫隨機取題。
          </p>
        </div>

        {/* Question type */}
        <div style={CARD_STYLE}>
          <SectionLabel label="題型" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "2px solid #1e2a4a",
                background: "#f0ede8",
                cursor: "default",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1e2a4a",
                userSelect: "none",
              }}
            >
              單選題
            </div>
            <ComingSoonCard label="閱讀測驗" />
            <ComingSoonCard label="克漏字" />
          </div>
        </div>

        {/* Source */}
        <div style={CARD_STYLE}>
          <SectionLabel label="題目來源" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "2px solid #1e2a4a",
                background: "#f0ede8",
                cursor: "default",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1e2a4a",
                userSelect: "none",
              }}
            >
              全部題庫
            </div>
            <ComingSoonCard label="年度考題" />
          </div>
        </div>

        {/* Count */}
        <div style={{ ...CARD_STYLE, marginBottom: "28px" }}>
          <SectionLabel label="題目數量" />
          <div style={{ display: "flex", gap: "10px" }}>
            {COUNTS.map((n) => {
              const sel = count === n;
              return (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "10px",
                    border: sel ? "2px solid #1e2a4a" : "1px solid #e8e4df",
                    background: sel ? "#f0ede8" : "#ffffff",
                    color: sel ? "#1e2a4a" : "#4a5568",
                    fontSize: "20px",
                    fontFamily: "var(--font-display)",
                    fontWeight: sel ? 700 : 400,
                    cursor: "pointer",
                    transition: "border-color 0.12s, background 0.12s",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={loading}
          onMouseEnter={() => setStartHovered(true)}
          onMouseLeave={() => setStartHovered(false)}
          style={{
            display: "block",
            width: "100%",
            padding: "17px",
            borderRadius: "12px",
            border: "none",
            background: loading
              ? "#8896b8"
              : startHovered
              ? "#2d3f6e"
              : "#1e2a4a",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.02em",
            transition: "background 0.15s",
          }}
        >
          {loading ? "生成中…" : `開始練習 ${count} 題`}
        </button>
      </div>
    </main>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#8896a4",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        margin: "0 0 14px",
      }}
    >
      {label}
    </p>
  );
}

function ComingSoonCard({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e8e4df",
        background: "#faf8f5",
        opacity: 0.6,
        cursor: "not-allowed",
        fontSize: "14px",
        color: "#8896a4",
        userSelect: "none",
      }}
    >
      {label}
      <span
        style={{
          position: "absolute",
          top: "-8px",
          right: "-6px",
          background: "#1e2a4a",
          color: "#c9a84c",
          fontSize: "9px",
          fontWeight: 700,
          padding: "2px 7px",
          borderRadius: "999px",
          letterSpacing: "0.06em",
        }}
      >
        SOON
      </span>
    </div>
  );
}
