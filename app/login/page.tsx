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

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  async function handleSubmit() {
    if (!email || !password) { setError("請填入 Email 與密碼"); return; }
    if (!isValidEmail(email)) { setError("請輸入有效的 Email 格式"); return; }
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
      if (msg.includes("Invalid login credentials")) setError("Email 或密碼錯誤");
      else if (msg.includes("User already registered")) setError("此 Email 已註冊，請直接登入");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function inputStyle(name: string): React.CSSProperties {
    const focused = inputFocus === name;
    return {
      width: "100%",
      padding: "13px 15px",
      borderRadius: "10px",
      border: focused ? "1.5px solid #1e2a4a" : "1.5px solid #e8e4df",
      background: "#faf8f5",
      fontSize: "15px",
      color: "#1a1f2e",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: focused ? "0 0 0 3px rgba(30, 42, 74, 0.10)" : "none",
      transition: "border-color 0.15s, box-shadow 0.15s",
      fontFamily: "var(--font-body)",
    };
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "44px 40px",
          boxShadow: "0 12px 40px rgba(30, 42, 74, 0.12)",
          border: "1px solid #e8e4df",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/"
            style={{
              color: "#8896a4",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1e2a4a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8896a4"; }}
          >
            ← 回首頁
          </Link>
        </div>

        {/* Brand */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "linear-gradient(135deg, #1e2a4a 0%, #3b6fd4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c9a84c",
                fontSize: "14px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              E
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 700,
                color: "#1e2a4a",
                letterSpacing: "-0.01em",
              }}
            >
              EduBank
            </span>
          </div>
          <p style={{ color: "#8896a4", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
            {mode === "login" ? "登入你的學習帳號" : "建立新帳號，立即開始練習"}
          </p>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            background: "#f0ede8",
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
                padding: "9px",
                borderRadius: "7px",
                border: "none",
                background: mode === m ? "#ffffff" : "transparent",
                color: mode === m ? "#1e2a4a" : "#8896a4",
                fontSize: "14px",
                fontWeight: mode === m ? 600 : 400,
                cursor: "pointer",
                boxShadow: mode === m ? "0 1px 4px rgba(30, 42, 74, 0.12)" : "none",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              {m === "login" ? "登入" : "註冊"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#4a5568",
                marginBottom: "7px",
              }}
            >
              Email
            </label>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "7px",
              }}
            >
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#4a5568" }}>
                密碼
              </label>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  style={{ fontSize: "12px", color: "#8896a4", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1e2a4a"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8896a4"; }}
                >
                  忘記密碼？
                </Link>
              )}
            </div>
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
              borderRadius: "9px",
              padding: "11px 14px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #6ee7b7",
              borderRadius: "9px",
              padding: "11px 14px",
              color: "#059669",
              fontSize: "13px",
              marginBottom: "16px",
              lineHeight: 1.5,
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
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#8896b8" : btnHovered ? "#2d3f6e" : "#1e2a4a",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "處理中…" : mode === "login" ? "登入" : "建立帳號"}
        </button>
      </div>
    </main>
  );
}
