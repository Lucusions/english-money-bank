"use client";

import { useState } from "react";

type PreviewItem = {
  type: string;
  question_no?: number | null;
  passage: string;
  group_title?: string;
  group_type?: string | null;
  option_set?: {
    title?: string;
    instruction?: string;
    items: {
      label?: string;
      text: string;
      sort_order: number;
    }[];
  } | null;
  question: {
    body: string;
    type: string;
    difficulty: string;
    instruction?: string;
    answer_text?: string;
    meta_json?: Record<string, any>;
  };
  options: {
    label?: string;
    text: string;
    is_correct: boolean;
  }[];
  tags: {
    name: string;
    category: string;
  }[];
};

export default function QuickImportPage() {
  const [rawText, setRawText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectedType, setDetectedType] = useState("");

  async function handleParse() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/quick-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "parse",
          text: rawText,
          answers: answerText,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error || "解析失敗");
        setPreview([]);
        setDetectedType("");
        return;
      }

      setPreview(result.data || []);
      setDetectedType(result.detected_type || "");
      setMessage(
        `解析完成，共 ${result.count || 0} 題，可直接在右邊修改後再匯入`
      );
    } catch (error: any) {
      setMessage(error?.message || "解析失敗");
      setPreview([]);
      setDetectedType("");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preview),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setMessage(result.error || "匯入失敗");
        return;
      }

      setMessage("匯入成功");
    } catch (error: any) {
      setMessage(error?.message || "匯入失敗");
    } finally {
      setLoading(false);
    }
  }

  function updatePassage(index: number, value: string) {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              passage: value,
            }
          : item
      )
    );
  }

  function updateQuestionBody(index: number, value: string) {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              question: {
                ...item.question,
                body: value,
              },
            }
          : item
      )
    );
  }

  function updateOptionText(questionIndex: number, optionIndex: number, value: string) {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === questionIndex
          ? {
              ...item,
              options: item.options.map((opt, j) =>
                j === optionIndex
                  ? {
                      ...opt,
                      text: value,
                    }
                  : opt
              ),
            }
          : item
      )
    );
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === questionIndex
          ? {
              ...item,
              options: item.options.map((opt, j) => ({
                ...opt,
                is_correct: j === optionIndex,
              })),
            }
          : item
      )
    );
  }

  function updateAnswerText(index: number, value: string) {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              question: {
                ...item.question,
                answer_text: value,
              },
            }
          : item
      )
    );
  }

  function removeQuestion(questionIndex: number) {
    setPreview((prev) => prev.filter((_, i) => i !== questionIndex));
  }

  function renderTypeLabel(type: string) {
    if (type === "single_choice") return "單選題";
    if (type === "reading_choice") return "閱讀題";
    if (type === "shared_option_fill") return "共用選項題";
    if (type === "short_answer") return "簡答題";
    if (type === "translation") return "翻譯題";
    if (type === "essay") return "作文題";
    return type;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px 20px",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: 800,
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          快速題庫匯入
        </h1>

        <p
          style={{
            color: "#4b5563",
            marginBottom: "20px",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          題目和答案可以分開貼上。先解析，再在右邊直接修正，最後匯入。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.25fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #d1d5db",
              boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: "10px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              原始題目
            </h3>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="貼上原始題目文字"
              style={{
                width: "100%",
                height: "300px",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                color: "#111827",
                background: "#ffffff",
                fontSize: "15px",
                lineHeight: "1.7",
                resize: "vertical",
                outline: "none",
              }}
            />

            <h3
              style={{
                marginTop: "18px",
                marginBottom: "10px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              答案（可另外貼）
            </h3>

            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="例如：1.B 2.C"
              style={{
                width: "100%",
                height: "120px",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                color: "#111827",
                background: "#ffffff",
                fontSize: "15px",
                lineHeight: "1.7",
                resize: "vertical",
                outline: "none",
              }}
            />

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleParse}
                disabled={loading || !rawText.trim()}
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                {loading ? "解析中..." : "解析題目"}
              </button>

              <button
                onClick={handleImport}
                disabled={loading || preview.length === 0}
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#16a34a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                匯入資料庫
              </button>
            </div>

            {detectedType && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                偵測題型：{detectedType}
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: "14px",
                  color: "#111827",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {message}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #d1d5db",
              boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              解析預覽（可直接修改）
            </h3>

            {preview.length === 0 && (
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: 1.7,
                  padding: "10px 0",
                }}
              >
                解析後會顯示在這裡，包含題型、文章、題目、選項與正解。
              </div>
            )}

            <div style={{ display: "grid", gap: "16px" }}>
              {preview.map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "14px",
                    padding: "16px",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: "18px",
                          color: "#111827",
                          display: "block",
                        }}
                      >
                        第 {i + 1} 題
                      </strong>

                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          {renderTypeLabel(item.type)}
                        </span>

                        {item.group_type && (
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: "#ede9fe",
                              color: "#6d28d9",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            {item.group_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeQuestion(i)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#ef4444",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      刪除
                    </button>
                  </div>

                  {(item.type === "reading_choice" || item.passage) && (
                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        文章（passage）
                      </div>

                      <textarea
                        value={item.passage || ""}
                        onChange={(e) => updatePassage(i, e.target.value)}
                        placeholder="如果這題是題組，文章會顯示在這裡"
                        style={{
                          width: "100%",
                          minHeight: "120px",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#111827",
                          fontSize: "15px",
                          lineHeight: "1.7",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  )}

                  {item.option_set && item.option_set.items.length > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        共用選項池（option set）
                      </div>

                      {item.option_set.instruction && (
                        <div
                          style={{
                            marginBottom: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "#f3f4f6",
                            color: "#374151",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {item.option_set.instruction}
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: "8px",
                        }}
                      >
                        {item.option_set.items.map((opt, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "10px",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: "#111827",
                              fontSize: "14px",
                            }}
                          >
                            <strong>{opt.label}.</strong> {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      題目
                    </div>

                    <textarea
                      value={item.question?.body || ""}
                      onChange={(e) => updateQuestionBody(i, e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "90px",
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#111827",
                        fontSize: "15px",
                        lineHeight: "1.7",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {item.options && item.options.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: "10px",
                        }}
                      >
                        選項（點右邊圓鈕設定正解）
                      </div>

                      <div style={{ display: "grid", gap: "10px" }}>
                        {item.options.map((opt, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "36px 1fr 70px",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "16px",
                                color: "#374151",
                              }}
                            >
                              {(opt.label || String.fromCharCode(65 + idx)) + "."}
                            </div>

                            <input
                              value={opt.text}
                              onChange={(e) =>
                                updateOptionText(i, idx, e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "12px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: "15px",
                              }}
                            />

                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "14px",
                                color: opt.is_correct ? "#16a34a" : "#374151",
                                fontWeight: opt.is_correct ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct-${i}`}
                                checked={!!opt.is_correct}
                                onChange={() => setCorrectOption(i, idx)}
                              />
                              正解
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(item.type === "short_answer" ||
                    item.type === "translation" ||
                    item.type === "essay" ||
                    item.type === "shared_option_fill") && (
                    <div style={{ marginTop: "14px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        參考答案 / 正解
                      </div>

                      <input
                        value={item.question?.answer_text || ""}
                        onChange={(e) => updateAnswerText(i, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#111827",
                          fontSize: "15px",
                        }}
                      />
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {item.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#e5e7eb",
                            color: "#111827",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}