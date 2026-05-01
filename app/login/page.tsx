"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inputFocus, setInputFocus] = useState<string | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("請填入 Email 與密碼");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = getSupabaseBrowser();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/account");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("帳號已建立！請確認 Email 後登入，或直接登入（若已關閉 Email 驗證）。");
        setMode("login");
      }
    } catch (err: any) {
      const msg = err?.message || "操作失敗，請稍後再試";
      if (msg.includes("Invalid login credentials")) {
        setError("Email 或密碼錯誤");
      } else if (msg.includes("User already registered")) {
        setError("此 Email 已註冊，請直接登入");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

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
        {/* Back */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/"
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← 回首頁
          </Link>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 6px",
          }}
        >
          英文題庫系統
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>
          {mode === "login" ? "登入你的帳號" : "建立新帳號"}
        </p>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "24px",
            gap: "4px",
          }}
        >
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setMessage(""); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "7px",
                border: "none",
                background: mode === m ? "#ffffff" : "transparent",
                color: mode === m ? "#111827" : "#6b7280",
                fontSize: "14px",
                fontWeight: mode === m ? 600 : 400,
                cursor: "pointer",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "background 0.12s",
              }}
            >
              {m === "login" ? "登入" : "註冊"}
            </button>
          ))}
        </div>

        {/* Fields */}
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setInputFocus("email")}
              onBlur={() => setInputFocus(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              style={inputStyle("email")}
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
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setInputFocus("password")}
              onBlur={() => setInputFocus(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={mode === "register" ? "至少 6 個字元" : "輸入密碼"}
              style={inputStyle("password")}
            />
          </div>
        </div>

        {/* Error / message */}
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
        {message && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#15803d",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {message}
          </div>
        )}

        {/* Submit */}
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
          {loading ? "處理中…" : mode === "login" ? "登入" : "建立帳號"}
        </button>
      </div>
    </main>
  );
}
