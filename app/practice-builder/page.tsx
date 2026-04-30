"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExamType = "cee" | "csat" | "toeic";
type CountOption = 5 | 10 | 20;

const EXAM_TYPES: { key: ExamType; label: string }[] = [
  { key: "cee", label: "會考" },
  { key: "csat", label: "學測" },
  { key: "toeic", label: "TOEIC" },
];

const COUNTS: CountOption[] = [5, 10, 20];

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

  function SectionTitle({ label }: { label: string }) {
    return (
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          margin: "0 0 12px",
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
          position: "relative" as const,
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1.5px solid #e5e7eb",
          background: "#f9fafb",
          opacity: 0.55,
          cursor: "not-allowed",
          fontSize: "14px",
          color: "#9ca3af",
          userSelect: "none" as const,
        }}
      >
        {label}
        <span
          style={{
            position: "absolute" as const,
            top: "-8px",
            right: "-6px",
            background: "#f59e0b",
            color: "#fff",
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "999px",
            letterSpacing: "0.04em",
          }}
        >
          SOON
        </span>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "48px 20px 80px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              marginBottom: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            練習設定
          </span>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}
          >
            設定練習內容
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
            選擇考試類型與題目數量，即時生成隨機練習題。
          </p>
        </div>

        {/* Exam type */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            marginBottom: "14px",
          }}
        >
          <SectionTitle label="考試類型" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
            {EXAM_TYPES.map((item) => {
              const selected = examType === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setExamType(item.key)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: selected ? "none" : "1.5px solid #e5e7eb",
                    background: selected ? "#2563eb" : "#fff",
                    color: selected ? "#fff" : "#6b7280",
                    fontSize: "14px",
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#d1d5db" }}>
            考試類型篩選即將推出，目前從全部題庫隨機取題。
          </p>
        </div>

        {/* Question type */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            marginBottom: "14px",
          }}
        >
          <SectionTitle label="題型" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {/* Single choice — enabled & always selected */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "2px solid #2563eb",
                background: "#eff6ff",
                cursor: "default",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1d4ed8",
                userSelect: "none" as const,
              }}
            >
              單選題
            </div>
            <ComingSoonCard label="閱讀測驗" />
            <ComingSoonCard label="克漏字" />
          </div>
        </div>

        {/* Source */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            marginBottom: "14px",
          }}
        >
          <SectionTitle label="題目來源" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {/* All — enabled & always selected */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "2px solid #2563eb",
                background: "#eff6ff",
                cursor: "default",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1d4ed8",
                userSelect: "none" as const,
              }}
            >
              全部題庫
            </div>
            <ComingSoonCard label="年度考題" />
          </div>
        </div>

        {/* Count */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            marginBottom: "28px",
          }}
        >
          <SectionTitle label="題目數量" />
          <div style={{ display: "flex", gap: "10px" }}>
            {COUNTS.map((n) => {
              const selected = count === n;
              return (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "10px",
                    border: selected ? "2px solid #2563eb" : "1.5px solid #e5e7eb",
                    background: selected ? "#eff6ff" : "#fff",
                    color: selected ? "#1d4ed8" : "#374151",
                    fontSize: "18px",
                    fontWeight: selected ? 700 : 400,
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

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={loading}
          onMouseEnter={() => setStartHovered(true)}
          onMouseLeave={() => setStartHovered(false)}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: loading ? "#93c5fd" : startHovered ? "#1d4ed8" : "#2563eb",
            color: "#fff",
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
