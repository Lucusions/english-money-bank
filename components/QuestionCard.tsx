"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import QuestionTagSelector from "./QuestionTagSelector";

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy: { label: "Easy", bg: "#dcfce7", color: "#166534" },
  medium: { label: "Medium", bg: "#fef3c7", color: "#92400e" },
  hard: { label: "Hard", bg: "#fee2e2", color: "#991b1b" },
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

  // Explanations
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loadingExpl, setLoadingExpl] = useState(true);

  // Auth / teacher
  const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Teacher write form
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contentFocused, setContentFocused] = useState(false);
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false);

  // Unlock
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

      // Fetch explanations
      const res = await fetch(`/api/explanations?question_id=${question.id}`);
      let explList: Explanation[] = [];
      if (res.ok) {
        const json = await res.json();
        explList = json.explanations ?? [];
        setExplanations(explList);
      }

      // Fetch already-unlocked explanations for this user
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
      setUnlockErrors((prev) => ({
        ...prev,
        [explanationId]: json.error || "解鎖失敗",
      }));
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
    // Auto-unlock own explanation
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

  // An explanation is viewable in full when:
  // - unlocked via the unlock flow, OR
  // - the current user is the author, OR
  // - the current user is an approved teacher
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
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Header */}
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
        <div style={{ flex: 1, minWidth: "240px" }}>
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

      {/* Options */}
      <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
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

      {/* Answer feedback */}
      {answered && (
        <div
          style={{
            borderRadius: "14px",
            padding: "12px 14px",
            background: isCorrectAnswer ? "#ecfdf5" : "#fef2f2",
            color: isCorrectAnswer ? "#166534" : "#991b1b",
            border: isCorrectAnswer ? "1px solid #bbf7d0" : "1px solid #fecaca",
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

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
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

      {/* Student tagging */}
      <QuestionTagSelector questionId={question.id} />

      {/* Explanations */}
      <div
        style={{
          borderTop: "1px solid #f3f4f6",
          paddingTop: "16px",
          marginTop: "16px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#9ca3af",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          老師詳解
        </p>

        {loadingExpl ? (
          <p style={{ fontSize: "13px", color: "#d1d5db", margin: 0 }}>載入中…</p>
        ) : explanations.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#d1d5db", margin: 0 }}>尚無詳解</p>
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
                    background: "#f8f7ff",
                    border: "1px solid #ede9fe",
                    borderRadius: "10px",
                    padding: "12px 14px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
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
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {expl.content}
                    </p>
                  ) : (
                    <div>
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: "14px",
                          color: "#9ca3af",
                          lineHeight: 1.7,
                        }}
                      >
                        {expl.content.slice(0, 30)}…
                      </p>

                      {unlockError && (
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "12px",
                            color: "#dc2626",
                          }}
                        >
                          {unlockError}
                        </p>
                      )}

                      <button
                        onClick={() => handleUnlock(expl.id)}
                        onMouseEnter={() => setUnlockBtnHovered(expl.id)}
                        onMouseLeave={() => setUnlockBtnHovered(null)}
                        disabled={isUnlocking || !accessToken}
                        style={{
                          padding: "6px 14px",
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

        {/* Write form for approved teachers */}
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
                padding: "10px 12px",
                borderRadius: "8px",
                border: contentFocused ? "1.5px solid #7c3aed" : "1.5px solid #e5e7eb",
                background: "#fafafa",
                fontSize: "14px",
                color: "#111827",
                outline: "none",
                resize: "vertical" as const,
                boxSizing: "border-box" as const,
                lineHeight: 1.6,
                boxShadow: contentFocused ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                marginBottom: "8px",
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
                padding: "8px 18px",
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
