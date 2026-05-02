"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";

// Display label (Chinese) + per-tag API category (English enum)
const CATEGORIES: {
  label: string;
  items: { name: string; category: string }[];
}[] = [
  {
    label: "題型",
    items: [
      { name: "單選",  category: "source"     },
      { name: "閱讀",  category: "reading"    },
      { name: "克漏字", category: "reading"   },
      { name: "文法",  category: "grammar"    },
      { name: "單字",  category: "vocabulary" },
    ],
  },
  {
    label: "考試",
    items: [
      { name: "會考",  category: "source" },
      { name: "學測",  category: "source" },
      { name: "TOEIC", category: "source" },
    ],
  },
  {
    label: "字彙級別",
    items: [
      { name: "2000單", category: "level" },
      { name: "4000單", category: "level" },
      { name: "7000單", category: "level" },
    ],
  },
  {
    label: "難度",
    items: [
      { name: "簡單", category: "level" },
      { name: "中等", category: "level" },
      { name: "困難", category: "level" },
    ],
  },
];

interface Props {
  questionId: string;
}

export default function QuestionTagSelector({ questionId }: Props) {
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    setSavedKeys(new Set());

    async function load() {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      if (session) setAccessToken(session.access_token);

      const res = await fetch(`/api/question-tags?question_id=${questionId}`);
      if (res.ok) {
        const json = await res.json();
        // keys are "englishCategory::name", matching what we build below
        setSavedKeys(
          new Set((json.tags ?? []).map((t: any) => `${t.category}::${t.name}`))
        );
      }
    }
    load();
  }, [questionId]);

  async function handleClick(name: string, category: string) {
    const key = `${category}::${name}`;
    if (savedKeys.has(key) || saving === key || !accessToken) return;

    setSavedKeys((prev) => new Set([...prev, key]));
    setSaving(key);
    setError("");

    const res = await fetch("/api/question-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        question_id: questionId,
        tags: [{ name, category }],   // English category goes to DB
      }),
    });

    const json = await res.json();
    setSaving(null);

    if (!res.ok) {
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setError(json.detail || json.error || "儲存失敗");
      return;
    }

    if (Array.isArray(json.tags) && json.tags.length > 0) {
      setSavedKeys(
        new Set((json.tags as any[]).map((t: any) => `${t.category}::${t.name}`))
      );
    } else {
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setError("儲存失敗，請重試");
    }
  }

  if (loggedIn === null) return null;

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #f1f5f9",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#94a3b8",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 10px",
        }}
      >
        協助分類這題
      </p>

      {!loggedIn ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
          <a
            href="/login"
            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
          >
            登入
          </a>
          {" "}後可協助分類
        </p>
      ) : (
        <div>
          <div style={{ display: "grid", gap: "10px" }}>
            {CATEGORIES.map(({ label, items }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#9ca3af",
                    minWidth: "52px",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {items.map(({ name, category }) => {
                    const tagKey = `${category}::${name}`;
                    const selected = savedKeys.has(tagKey);
                    const isSaving = saving === tagKey;
                    const hovered = hoveredKey === tagKey;

                    return (
                      <button
                        key={tagKey}
                        onClick={() => handleClick(name, category)}
                        onMouseEnter={() => !selected && setHoveredKey(tagKey)}
                        onMouseLeave={() => setHoveredKey(null)}
                        disabled={selected || isSaving}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: selected ? 600 : 500,
                          cursor: selected ? "default" : isSaving ? "wait" : "pointer",
                          transition: "background 0.12s, border-color 0.12s, color 0.12s",
                          border: selected
                            ? "1.5px solid #bfdbfe"
                            : hovered
                            ? "1.5px solid #93c5fd"
                            : "1.5px solid #e2e8f0",
                          background: selected
                            ? "#eff6ff"
                            : hovered
                            ? "#f0f7ff"
                            : "#ffffff",
                          color: selected
                            ? "#2563eb"
                            : hovered
                            ? "#3b82f6"
                            : "#6b7280",
                        }}
                      >
                        {isSaving ? "…" : name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#dc2626" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
