"use client";

import { useState, useMemo } from "react";
import QuestionCard from "../../components/QuestionCard";
import ReadingGroupCard from "../../components/ReadingGroupCard";
import HomeButton from "../../components/HomeButton";
import AuthButton from "../../components/AuthButton";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const renderItems = useMemo(() => {
    const seen = new Set<string>();
    const groupMap = new Map<string, any[]>();

    for (const q of questions) {
      if (q.group_id) {
        if (!groupMap.has(q.group_id)) groupMap.set(q.group_id, []);
        groupMap.get(q.group_id)!.push(q);
      }
    }

    const items: Array<
      | { type: "single"; question: any }
      | { type: "group"; groupId: string; questions: any[] }
    > = [];

    for (const q of questions) {
      if (!q.group_id) {
        items.push({ type: "single", question: q });
      } else if (!seen.has(q.group_id)) {
        seen.add(q.group_id);
        items.push({
          type: "group",
          groupId: q.group_id,
          questions: groupMap.get(q.group_id)!,
        });
      }
    }

    return items;
  }, [questions]);

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
        background: "#faf8f5",
        padding: "52px 20px 96px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        <HomeButton />
        <AuthButton />

        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#fdf8ee",
              color: "#c9a84c",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "4px 12px",
              borderRadius: "999px",
              marginBottom: "14px",
              textTransform: "uppercase",
              border: "1px solid #f5e6c8",
            }}
          >
            題庫搜尋
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "#1e2a4a",
              margin: "0 0 10px",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
            }}
          >
            英文題庫搜尋
          </h1>
          <p
            style={{
              color: "#8896a4",
              fontSize: "15px",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            輸入關鍵字搜尋題目，即時預覽題目與選項。
          </p>
        </div>

        {/* Search bar */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8e4df",
            borderRadius: "18px",
            padding: "16px",
            boxShadow: "0 4px 16px rgba(30, 42, 74, 0.07)",
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
              placeholder="輸入關鍵字，例如：she、meeting、homework…"
              style={{
                flex: 1,
                minWidth: "220px",
                padding: "13px 16px",
                border: inputFocused
                  ? "1.5px solid #1e2a4a"
                  : "1.5px solid #e8e4df",
                borderRadius: "10px",
                fontSize: "15px",
                color: "#1a1f2e",
                background: "#faf8f5",
                outline: "none",
                boxShadow: inputFocused
                  ? "0 0 0 3px rgba(30, 42, 74, 0.10)"
                  : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                padding: "13px 28px",
                borderRadius: "10px",
                border: "none",
                background: loading
                  ? "#8896b8"
                  : btnHovered
                  ? "#2d3f6e"
                  : "#1e2a4a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: "96px",
                letterSpacing: "0.02em",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              {loading ? "搜尋中…" : "搜尋"}
            </button>
          </div>
        </div>

        {/* Result count / status */}
        <div style={{ minHeight: "32px", marginBottom: "20px" }}>
          {loading && (
            <span style={{ color: "#8896a4", fontSize: "14px" }}>
              正在搜尋題目…
            </span>
          )}
          {!loading && searched && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ecfdf5",
                color: "#059669",
                fontSize: "13px",
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: "999px",
                border: "1px solid #6ee7b7",
              }}
            >
              找到{" "}
              <strong style={{ fontWeight: 800, fontSize: "14px" }}>
                {questions.length}
              </strong>{" "}
              題
            </span>
          )}
        </div>

        {/* Question list */}
        <div style={{ display: "grid", gap: "16px" }}>
          {!loading && searched && questions.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e4df",
                borderRadius: "16px",
                padding: "52px 28px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(30, 42, 74, 0.05)",
              }}
            >
              <p
                style={{
                  color: "#1a1f2e",
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 8px",
                }}
              >
                找不到符合的題目
              </p>
              <p style={{ color: "#b4bec8", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
                試試不同的關鍵字，或縮短搜尋詞。
              </p>
            </div>
          )}

          {renderItems.map((item) =>
            item.type === "single" ? (
              <QuestionCard key={item.question.id} question={item.question} />
            ) : (
              <ReadingGroupCard key={item.groupId} questions={item.questions} />
            )
          )}
        </div>
      </div>
    </main>
  );
}
