"use client";

import { useState } from "react";
import QuestionCard from "../../components/QuestionCard";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  async function handleSearch() {
    try {
      setLoading(true);
      setSearched(true);

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const result = await res.json();
      setQuestions(result.data || []);
    } catch (error) {
      console.error(error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "48px 20px 80px",
        fontFamily:
          "'Inter', 'Noto Sans TC', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "32px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: "999px",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            題庫平台 Beta
          </span>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}
          >
            英文題庫搜尋
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "15px",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            輸入關鍵字搜尋單選題，即時預覽題目與答案。
          </p>
        </div>

        {/* ── Search bar ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="輸入關鍵字，例如 she、meeting、homework"
              style={{
                flex: 1,
                minWidth: "240px",
                padding: "12px 16px",
                border: inputFocused
                  ? "1.5px solid #2563eb"
                  : "1.5px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                color: "#111827",
                background: "#fafafa",
                outline: "none",
                boxShadow: inputFocused
                  ? "0 0 0 3px rgba(37, 99, 235, 0.12)"
                  : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                background: loading
                  ? "#93c5fd"
                  : btnHovered
                  ? "#1d4ed8"
                  : "#2563eb",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: "100px",
                letterSpacing: "0.01em",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              {loading ? "搜尋中…" : "搜尋"}
            </button>
          </div>
        </div>

        {/* ── Result count ── */}
        <div style={{ minHeight: "28px", marginBottom: "16px" }}>
          {loading && (
            <span style={{ color: "#6b7280", fontSize: "14px" }}>
              正在搜尋題目…
            </span>
          )}
          {!loading && searched && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f0fdf4",
                color: "#15803d",
                fontSize: "13px",
                fontWeight: 500,
                padding: "4px 12px",
                borderRadius: "999px",
                border: "1px solid #bbf7d0",
              }}
            >
              找到
              <strong style={{ fontWeight: 700 }}>{questions.length}</strong>
              題
            </span>
          )}
        </div>

        {/* ── Question list ── */}
        <div style={{ display: "grid", gap: "14px" }}>
          {!loading && searched && questions.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "40px 28px",
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "12px",
                  lineHeight: 1,
                }}
              >
                🔍
              </div>
              <p
                style={{
                  color: "#374151",
                  fontSize: "15px",
                  fontWeight: 500,
                  margin: "0 0 6px",
                }}
              >
                找不到符合的題目
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                試試不同的關鍵字，或縮短搜尋詞。
              </p>
            </div>
          )}

          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    </main>
  );
}
