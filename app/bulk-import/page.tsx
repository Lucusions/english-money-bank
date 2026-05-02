"use client";

import { useState } from "react";
import Link from "next/link";

interface FailedItem {
  index: number;
  error: string;
}

type Status = "idle" | "valid" | "invalid" | "importing" | "done" | "error";

export default function BulkImportPage() {
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [parseError, setParseError] = useState("");
  const [parsed, setParsed] = useState<unknown[] | null>(null);
  const [insertedCount, setInsertedCount] = useState(0);
  const [failed, setFailed] = useState<FailedItem[]>([]);
  const [apiError, setApiError] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);

  function handleValidate() {
    setParseError("");
    setApiError("");
    setFailed([]);
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        setParseError("JSON 必須是陣列 [ ... ]");
        setStatus("invalid");
        setParsed(null);
        return;
      }
      if (data.length === 0) {
        setParseError("陣列不能為空");
        setStatus("invalid");
        setParsed(null);
        return;
      }
      setParsed(data);
      setStatus("valid");
    } catch (e: any) {
      setParseError(e.message || "JSON 格式錯誤");
      setStatus("invalid");
      setParsed(null);
    }
  }

  async function handleImport() {
    if (!parsed) return;
    setStatus("importing");
    setApiError("");
    setFailed([]);

    try {
      const res = await fetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (e: any) {
      setApiError(e.message || "網路錯誤");
      setStatus("error");
    }
  }

  const canImport = status === "valid" && parsed !== null;
  const isImporting = status === "importing";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "32px 20px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Back */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/"
            style={{ color: "#9ca3af", fontSize: "13px", textDecoration: "none" }}
          >
            ← 回首頁
          </Link>
        </div>

        {/* Header */}
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
          批次匯入題目
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>
          貼上 JSON 陣列，每個物件包含 question、options、tags
        </p>

        {/* Textarea */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            JSON 內容
          </label>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setStatus("idle");
              setParsed(null);
              setParseError("");
            }}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            placeholder={`[\n  {\n    "question": { "body": "He ____ finished his work.", "difficulty": "easy" },\n    "options": [\n      { "text": "have", "is_correct": false },\n      { "text": "has", "is_correct": true }\n    ],\n    "tags": [{ "name": "文法", "category": "grammar" }]\n  }\n]`}
            rows={18}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: textareaFocused ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
              background: "#ffffff",
              fontSize: "13px",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              color: "#111827",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.6,
              boxShadow: textareaFocused ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button
            onClick={handleValidate}
            disabled={!raw.trim() || isImporting}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1.5px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 600,
              cursor: !raw.trim() || isImporting ? "not-allowed" : "pointer",
              opacity: !raw.trim() || isImporting ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            驗證 JSON
          </button>

          <button
            onClick={handleImport}
            disabled={!canImport || isImporting}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: !canImport || isImporting ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: !canImport || isImporting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isImporting ? "匯入中…" : "匯入資料"}
          </button>
        </div>

        {/* Validation feedback */}
        {status === "valid" && parsed && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "#15803d",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            ✓ JSON 格式正確，共 {parsed.length} 題，可以匯入
          </div>
        )}

        {status === "invalid" && parseError && (
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
            ✗ {parseError}
          </div>
        )}

        {/* Import result */}
        {status === "done" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: insertedCount > 0 ? "#15803d" : "#6b7280",
                margin: "0 0 8px",
              }}
            >
              {insertedCount > 0 ? `✓ 成功匯入 ${insertedCount} 題` : "匯入完成（0 題成功）"}
            </p>

            {failed.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626", margin: "0 0 8px" }}>
                  失敗 {failed.length} 題：
                </p>
                <div style={{ display: "grid", gap: "6px" }}>
                  {failed.map((f) => (
                    <div
                      key={f.index}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        color: "#991b1b",
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

        {(status === "error" && apiError) && (
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
            ✗ {apiError}
          </div>
        )}

        {/* Schema hint */}
        <details style={{ marginTop: "24px" }}>
          <summary
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#9ca3af",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            查看 JSON 格式說明
          </summary>
          <pre
            style={{
              marginTop: "12px",
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#374151",
              lineHeight: 1.7,
              overflowX: "auto",
              whiteSpace: "pre",
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
