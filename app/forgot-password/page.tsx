"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError("請填入 Email");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (err) {
      setError(err.message || "寄送失敗，請稍後再試");
      return;
    }

    setSent(true);
  }

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
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.09)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/login"
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← 回登入
          </Link>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
          忘記密碼
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>
          輸入你的 Email，我們將寄送重設連結
        </p>

        {sent ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              padding: "14px 16px",
              color: "#15803d",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            已寄出重設密碼信，請至 <strong>{email}</strong> 收信，並點擊信中連結。
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setInputFocus(true)}
                onBlur={() => setInputFocus(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: inputFocus ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
                  background: "#fafafa",
                  fontSize: "15px",
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: inputFocus ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              />
            </div>

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

            <button
              onClick={handleSubmit}
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#93c5fd" : btnHovered ? "#1d4ed8" : "#2563eb",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "寄送中…" : "寄送重設密碼信"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
