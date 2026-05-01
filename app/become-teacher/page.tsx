"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import AuthButton from "../../components/AuthButton";

type TeacherStatus = "none" | "pending" | "approved" | "rejected";

export default function BecomeTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [teacherStatus, setTeacherStatus] = useState<TeacherStatus>("none");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bioFocused, setBioFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("teacher_status, bio")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTeacherStatus((profile.teacher_status as TeacherStatus) ?? "none");
        setBio(profile.bio ?? "");
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSubmit() {
    if (!bio.trim()) {
      setError("請填寫自我介紹");
      return;
    }

    setSubmitting(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        bio: bio.trim(),
        teacher_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message || "送出失敗，請稍後再試");
      setSubmitting(false);
      return;
    }

    router.push("/account");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <AuthButton />
        <p style={{ color: "#9ca3af", fontSize: "15px" }}>載入中…</p>
      </main>
    );
  }

  // ── Already pending ──
  if (teacherStatus === "pending") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <AuthButton />
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "48px 36px",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>
            申請審核中
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 28px", lineHeight: 1.6 }}>
            你的申請已送出，管理員會盡快審核。
          </p>
          <Link
            href="/account"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              borderRadius: "10px",
              background: "#f3f4f6",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            回到帳號頁
          </Link>
        </div>
      </main>
    );
  }

  // ── Already approved ──
  if (teacherStatus === "approved") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <AuthButton />
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "48px 36px",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#15803d", margin: "0 0 10px" }}>
            你已是老師！
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 28px" }}>
            你的老師身份已通過審核。
          </p>
          <Link
            href="/account"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              borderRadius: "10px",
              background: "#f0fdf4",
              color: "#15803d",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid #86efac",
            }}
          >
            回到帳號頁
          </Link>
        </div>
      </main>
    );
  }

  // ── Application form (none or rejected) ──
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "48px 20px 80px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <AuthButton />
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>

        {/* Back */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/account"
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "7px",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
            }}
          >
            ← 回帳號頁
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          {teacherStatus === "rejected" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              上一次申請未通過，你可以重新填寫自我介紹後再次申請。
            </div>
          )}
          <span
            style={{
              display: "inline-block",
              background: "#f5f3ff",
              color: "#7c3aed",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "999px",
              marginBottom: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            老師申請
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
            申請成為老師
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
            填寫自我介紹，讓管理員了解你的背景與教學方向。
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 2px 10px rgba(15,23,42,0.07)",
            border: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            自我介紹
          </label>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 12px", lineHeight: 1.5 }}>
            介紹你的英文教學背景、擅長領域、教學風格等。
          </p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onFocus={() => setBioFocused(true)}
            onBlur={() => setBioFocused(false)}
            placeholder="例如：我有五年英文家教經驗，擅長文法與閱讀理解，曾輔導多位學生考取高分…"
            rows={6}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: bioFocused ? "1.5px solid #7c3aed" : "1.5px solid #d1d5db",
              background: "#fafafa",
              fontSize: "15px",
              color: "#111827",
              outline: "none",
              resize: "vertical" as const,
              boxSizing: "border-box" as const,
              lineHeight: 1.6,
              boxShadow: bioFocused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#d1d5db", textAlign: "right" as const }}>
            {bio.length} 字
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: submitting ? "#c4b5fd" : btnHovered ? "#6d28d9" : "#7c3aed",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {submitting ? "送出中…" : "送出申請"}
        </button>
      </div>
    </main>
  );
}
