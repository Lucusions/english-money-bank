"use client";

import { useState } from "react";
import HomeButton from "../../components/HomeButton";
import AuthButton from "../../components/AuthButton";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

interface FailedItem {
  index: number;
  error: string;
}

type Status = "idle" | "importing" | "done" | "error";

export default function BulkImportPage() {
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [parseError, setParseError] = useState("");
  const [insertedCount, setInsertedCount] = useState(0);
  const [failed, setFailed] = useState<FailedItem[]>([]);
  const [apiError, setApiError] = useState("");
  const [focused, setFocused] = useState(false);

  async function handleImport() {
    setParseError("");
    setApiError("");
    setFailed([]);

    let parsed: unknown[];
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data) || data.length === 0) {
        setParseError("JSON 必須是非空陣列 [ ... ]");
        setStatus("error");
        return;
      }
      parsed = data;
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "JSON 格式錯誤");
      setStatus("error");
      return;
    }

    setStatus("importing");

    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setApiError("請先登入");
        setStatus("error");
        return;
      }

      const res = await fetch("/api/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error || "匯入失敗");
        setStatus("error");
        return;
      }

      setInsertedCount(json.inserted_questions ?? 0);
      setFailed(json.failed ?? []);
      setStatus("done");
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "網路錯誤");
      setStatus("error");
    }
  }

  const isImporting = status === "importing";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        padding: "52px 20px 96px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        <HomeButton />
        <AuthButton />

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#1e2a4a",
              color: "#c9a84c",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "999px",
              marginBottom: "14px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Admin
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              color: "#1e2a4a",
              margin: "0 0 10px",
              letterSpacing: "-0.015em",
            }}
          >
            批次匯入題目
          </h1>
          <p style={{ color: "#8896a4", fontSize: "14px", margin: 0, lineHeight: 1.65 }}>
            貼上 JSON 陣列，每個物件包含 question、options、tags
          </p>
        </div>

        {/* JSON Textarea */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8e4df",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 16px rgba(30, 42, 74, 0.06)",
            marginBottom: "16px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#8896a4",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            JSON 內容
          </label>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setStatus("idle");
              setParseError("");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`[\n  {\n    "question": { "body": "He ____ finished his work.", "difficulty": "easy" },\n    "options": [\n      { "text": "have", "is_correct": false },\n      { "text": "has", "is_correct": true }\n    ],\n    "tags": [{ "name": "文法", "category": "grammar" }]\n  }\n]`}
            rows={18}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "10px",
              border: focused ? "1.5px solid #1e2a4a" : "1.5px solid #e8e4df",
              background: "#faf8f5",
              fontSize: "13px",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              color: "#1a1f2e",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.65,
              boxShadow: focused ? "0 0 0 3px rgba(30, 42, 74, 0.10)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
        </div>

        {/* Import button */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleImport}
            disabled={!raw.trim() || isImporting}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: !raw.trim() || isImporting ? "#8896b8" : "#1e2a4a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: !raw.trim() || isImporting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              if (raw.trim() && !isImporting) {
                (e.currentTarget as HTMLButtonElement).style.background = "#2d3f6e";
              }
            }}
            onMouseLeave={(e) => {
              if (raw.trim() && !isImporting) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1e2a4a";
              }
            }}
          >
            {isImporting ? "匯入中…" : "執行匯入"}
          </button>
        </div>

        {/* Error */}
        {(parseError || apiError) && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "10px",
              padding: "13px 16px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            ✗ {parseError || apiError}
          </div>
        )}

        {/* Success result */}
        {status === "done" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8e4df",
              borderRadius: "14px",
              padding: "22px 24px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(30, 42, 74, 0.06)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: insertedCount > 0 ? "#059669" : "#8896a4",
                margin: "0 0 10px",
              }}
            >
              {insertedCount > 0
                ? `✓ 成功匯入 ${insertedCount} 題`
                : "匯入完成（0 題成功）"}
            </p>

            {failed.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#dc2626",
                    margin: "0 0 10px",
                  }}
                >
                  失敗 {failed.length} 題：
                </p>
                <div style={{ display: "grid", gap: "6px" }}>
                  {failed.map((f) => (
                    <div
                      key={f.index}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: "8px",
                        padding: "9px 13px",
                        fontSize: "13px",
                        color: "#991b1b",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Format docs */}
        <details style={{ marginTop: "24px" }}>
          <summary
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#8896a4",
              cursor: "pointer",
              userSelect: "none",
              padding: "4px 0",
            }}
          >
            查看 JSON 格式說明
          </summary>
          <pre
            style={{
              marginTop: "14px",
              padding: "18px 20px",
              background: "#ffffff",
              border: "1px solid #e8e4df",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#4a5568",
              lineHeight: 1.75,
              overflowX: "auto",
              whiteSpace: "pre",
              fontFamily: "'Fira Code', 'Courier New', monospace",
            }}
          >{`[
  {
    "question": {
      "body": "題目文字（必填）",
      "type": "single",          // 選填，預設 "single"
      "difficulty": "easy"       // easy / medium / hard，預設 "medium"
    },
    "options": [                 // 至少 2 個，恰好 1 個 is_correct: true
      { "text": "選項文字", "is_correct": false },
      { "text": "正確選項", "is_correct": true }
    ],
    "tags": [                    // 選填
      { "name": "文法", "category": "grammar" },
      { "name": "會考", "category": "source" }
    ]
  }
]

category 對照：
  grammar     → 文法
  vocabulary  → 單字
  reading     → 閱讀 / 克漏字
  source      → 會考 / 學測 / TOEIC / 單選
  level       → 2000單 / 4000單 / 7000單 / 簡單 / 中等 / 困難`}
          </pre>
        </details>
      </div>
    </main>
  );
}
