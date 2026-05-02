"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputFocus, setInputFocus] = useState<string | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);

  function inputStyle(name: string): React.CSSProperties {
    return {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: inputFocus === name ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
      background: "#fafafa",
      fontSize: "15px",
      color: "#111827",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: inputFocus === name ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
      transition: "border-color 0.15s, box-shadow 0.15s",
    };
  }

  async function handleSubmit() {
    if (!password || !confirm) {
      setError("請填寫所有欄位");
      return;
    }
    if (password.length < 6) {
      setError("密碼至少需要 6 個字元");
      return;
    }
    if (password !== confirm) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (err) {
      setError(err.message || "更新失敗，請稍後再試");
      return;
    }

    router.push("/login");
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
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
          重設密碼
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>
          輸入你的新密碼
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              新密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setInputFocus("password")}
              onBlur={() => setInputFocus(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="至少 6 個字元"
              style={inputStyle("password")}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              確認新密碼
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setInputFocus("confirm")}
              onBlur={() => setInputFocus(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="再輸入一次"
              style={inputStyle("confirm")}
            />
          </div>
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
          {loading ? "更新中…" : "更新密碼"}
        </button>
      </div>
    </main>
  );
}
