"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import QuestionTagSelector from "./QuestionTagSelector";

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy:   { label: "Easy",   bg: "#dcfce7", color: "#166534" },
  medium: { label: "Medium", bg: "#fef3c7", color: "#92400e" },
  hard:   { label: "Hard",   bg: "#fee2e2", color: "#991b1b" },
};

interface Explanation {
  id: string;
  content: string;
  created_at: string;
  teacher_id: string;
  profiles: { display_name: string | null } | null;
}

export default function QuestionCard({ question }: { question: any }) {
  const [selected, setSelected] = useState<string | null>(null);

  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loadingExpl, setLoadingExpl] = useState(true);

  const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contentFocused, setContentFocused] = useState(false);
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false);

  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockErrors, setUnlockErrors] = useState<Record<string, string>>({});
  const [unlockBtnHovered, setUnlockBtnHovered] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("teacher_status")
          .eq("id", session.user.id)
          .single();

        setTeacherStatus(profile?.teacher_status ?? null);
      }

      const res = await fetch(`/api/explanations?question_id=${question.id}`);
      let explList: Explanation[] = [];
      if (res.ok) {
        const json = await res.json();
        explList = json.explanations ?? [];
        setExplanations(explList);
      }

      if (session && explList.length > 0) {
        const { data: unlocks } = await supabase
          .from("explanation_unlocks")
          .select("explanation_id")
          .eq("user_id", session.user.id)
          .in("explanation_id", explList.map((e) => e.id));

        if (unlocks) {
          setUnlockedIds(new Set(unlocks.map((u: any) => u.explanation_id as string)));
        }
      }

      setLoadingExpl(false);
    }

    loadData();
  }, [question.id]);

  async function handleUnlock(explanationId: string) {
    if (!accessToken || unlocking) return;

    setUnlocking(explanationId);
    setUnlockErrors((prev) => {
      const next = { ...prev };
      delete next[explanationId];
      return next;
    });

    const res = await fetch("/api/explanations/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ explanation_id: explanationId }),
    });

    const json = await res.json();
    setUnlocking(null);

    if (!res.ok) {
      setUnlockErrors((prev) => ({ ...prev, [explanationId]: json.error || "解鎖失敗" }));
      return;
    }

    setUnlockedIds((prev) => new Set([...prev, explanationId]));
  }

  async function handleSubmitExplanation() {
    if (!newContent.trim()) return;

    setSubmitting(true);
    setSubmitError("");

    const res = await fetch("/api/explanations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ question_id: question.id, content: newContent.trim() }),
    });

    const json = await res.json();

    if (!res.ok) {
      setSubmitError(json.error || "送出失敗");
      setSubmitting(false);
      return;
    }

    setExplanations((prev) => [...prev, json.explanation]);
    if (json.explanation?.id) {
      setUnlockedIds((prev) => new Set([...prev, json.explanation.id]));
    }
    setNewContent("");
    setSubmitting(false);
  }

  const answered = selected !== null;

  const handleSelect = (id: string) => {
    if (!answered) setSelected(id);
  };

  const isCorrectAnswer = answered
    ? question.options.find((o: any) => o.id === selected)?.is_correct === true
    : null;

  const getOptionStyle = (optId: string, isCorrect: boolean | undefined) => {
    if (!answered) {
      return {
        border: "1px solid #e8e4df",
        background: "#ffffff",
        color: "#1a1f2e",
      };
    }
    if (isCorrect) {
      return {
        border: "1px solid #6ee7b7",
        background: "#ecfdf5",
        color: "#065f46",
      };
    }
    if (optId === selected && !isCorrect) {
      return {
        border: "1px solid #fca5a5",
        background: "#fef2f2",
        color: "#991b1b",
      };
    }
    return {
      border: "1px solid #e8e4df",
      background: "#f7f8fa",
      color: "#b4bec8",
    };
  };

  const difficulty = difficultyMap[question.difficulty] || {
    label: question.difficulty || "—",
    bg: "#e5e7eb",
    color: "#374151",
  };

  function isFullyVisible(expl: Explanation) {
    return (
      unlockedIds.has(expl.id) ||
      expl.teacher_id === userId ||
      teacherStatus === "approved"
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e4df",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 4px 16px rgba(30, 42, 74, 0.07)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "14px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          {question.group_title && (
            <div style={{ marginBottom: "10px" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "#fdf8ee",
                  color: "#a07030",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "999px",
                  letterSpacing: "0.04em",
                  border: "1px solid #f5e6c8",
                }}
              >
                題組：{question.group_title}
              </span>
            </div>
          )}
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#8896a4",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Question
          </div>
          <div
            style={{
              fontSize: "17px",
              lineHeight: 1.75,
              color: "#1a1f2e",
              fontWeight: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {question.body}
          </div>
        </div>

        <div
          style={{
            padding: "5px 12px",
            borderRadius: "999px",
            background: difficulty.bg,
            color: difficulty.color,
            fontSize: "12px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            letterSpacing: "0.03em",
          }}
        >
          {difficulty.label}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gap: "9px", marginBottom: "18px" }}>
        {question.options.map((opt: any, index: number) => {
          const optStyle = getOptionStyle(opt.id, opt.is_correct);
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              style={{
                ...optStyle,
                width: "100%",
                textAlign: "left",
                padding: "14px 18px",
                borderRadius: "12px",
                cursor: answered ? "default" : "pointer",
                fontSize: "15px",
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
                  marginRight: "10px",
                  color: answered ? undefined : "#4a5568",
                }}
              >
                {String.fromCharCode(65 + index)}.
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
            borderRadius: "12px",
            padding: "14px 16px",
            background: isCorrectAnswer ? "#ecfdf5" : "#fef2f2",
            color: isCorrectAnswer ? "#065f46" : "#991b1b",
            border: isCorrectAnswer ? "1px solid #6ee7b7" : "1px solid #fca5a5",
            marginBottom: "18px",
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
                lineHeight: 1.65,
              }}
            >
              {question.explanation}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "20px" }}>
          {question.tags.map((tag: any) => (
            <span
              key={tag.id}
              style={{
                padding: "5px 11px",
                borderRadius: "999px",
                background: "#f2f4f8",
                color: "#4a5568",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid #e8e4df",
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Student tagging */}
      <QuestionTagSelector questionId={question.id} />

      {/* Explanations */}
      <div
        style={{
          borderTop: "1px solid #f0ede8",
          paddingTop: "20px",
          marginTop: "20px",
        }}
      >
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
          老師詳解
        </p>

        {loadingExpl ? (
          <p style={{ fontSize: "13px", color: "#b4bec8", margin: 0 }}>載入中…</p>
        ) : explanations.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#b4bec8", margin: 0 }}>尚無詳解</p>
        ) : (
          <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
            {explanations.map((expl) => {
              const visible = isFullyVisible(expl);
              const isUnlocking = unlocking === expl.id;
              const unlockError = unlockErrors[expl.id];
              const btnHovered = unlockBtnHovered === expl.id;

              return (
                <div
                  key={expl.id}
                  style={{
                    background: "#f5f3ff",
                    border: "1px solid #ede9fe",
                    borderRadius: "10px",
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#7c3aed",
                    }}
                  >
                    {expl.profiles?.display_name ?? "老師"}
                  </p>

                  {visible ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#374151",
                        lineHeight: 1.75,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {expl.content}
                    </p>
                  ) : (
                    <div>
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "14px",
                          color: "#a78bfa",
                          lineHeight: 1.65,
                        }}
                      >
                        {expl.content.slice(0, 30)}…
                      </p>

                      {unlockError && (
                        <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#dc2626" }}>
                          {unlockError}
                        </p>
                      )}

                      <button
                        onClick={() => handleUnlock(expl.id)}
                        onMouseEnter={() => setUnlockBtnHovered(expl.id)}
                        onMouseLeave={() => setUnlockBtnHovered(null)}
                        disabled={isUnlocking || !accessToken}
                        style={{
                          padding: "7px 16px",
                          borderRadius: "8px",
                          border: "none",
                          background: !accessToken
                            ? "#e5e7eb"
                            : isUnlocking
                            ? "#c4b5fd"
                            : btnHovered
                            ? "#6d28d9"
                            : "#7c3aed",
                          color: !accessToken ? "#9ca3af" : "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: isUnlocking || !accessToken ? "not-allowed" : "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        {isUnlocking
                          ? "解鎖中…"
                          : !accessToken
                          ? "登入後可解鎖"
                          : "解鎖詳解（10代幣）"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {teacherStatus === "approved" && (
          <div style={{ marginTop: explanations.length > 0 ? "0" : "8px" }}>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onFocus={() => setContentFocused(true)}
              onBlur={() => setContentFocused(false)}
              placeholder="撰寫詳解，幫助學生理解這道題…"
              rows={3}
              style={{
                width: "100%",
                padding: "11px 13px",
                borderRadius: "9px",
                border: contentFocused ? "1.5px solid #7c3aed" : "1.5px solid #e8e4df",
                background: "#fafafa",
                fontSize: "14px",
                color: "#1a1f2e",
                outline: "none",
                resize: "vertical" as const,
                boxSizing: "border-box" as const,
                lineHeight: 1.65,
                boxShadow: contentFocused ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                marginBottom: "9px",
                fontFamily: "var(--font-body)",
              }}
            />

            {submitError && (
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#dc2626" }}>
                {submitError}
              </p>
            )}

            <button
              onClick={handleSubmitExplanation}
              disabled={submitting || !newContent.trim()}
              onMouseEnter={() => setSubmitBtnHovered(true)}
              onMouseLeave={() => setSubmitBtnHovered(false)}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background:
                  submitting || !newContent.trim()
                    ? "#c4b5fd"
                    : submitBtnHovered
                    ? "#6d28d9"
                    : "#7c3aed",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: submitting || !newContent.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "送出中…" : "新增詳解"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
