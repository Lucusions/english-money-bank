"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

const ROLE_LABEL: Record<string, string> = {
  student: "學生",
  teacher: "老師",
  admin:   "管理員",
};

const ROLE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  student: { bg: "#f0ede8",  color: "#1e2a4a",  border: "#e8e4df" },
  teacher: { bg: "#f5f3ff",  color: "#7c3aed",  border: "#ede9fe" },
  admin:   { bg: "#fef2f2",  color: "#dc2626",  border: "#fca5a5" },
};

const TEACHER_STATUS_LABEL: Record<string, string> = {
  none:     "尚未申請",
  pending:  "審核中",
  approved: "已通過",
  rejected: "未通過",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#8896a4",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  margin: "0 0 18px",
};

const INFO_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [applyHovered, setApplyHovered] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("wallets").select("*").eq("user_id", user.id).single(),
      ]);

      setProfile(profileRes.data);
      setWallet(walletRes.data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-body)",
        }}
      >
        <p style={{ color: "#8896a4", fontSize: "15px" }}>載入中…</p>
      </main>
    );
  }

  const teacherStatus = profile?.teacher_status ?? "none";
  const role =
    teacherStatus === "approved"
      ? "teacher"
      : profile?.role === "admin"
      ? "admin"
      : "student";
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.student;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        padding: "52px 20px 96px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Back */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/"
            style={{
              color: "#8896a4",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 13px",
              borderRadius: "8px",
              background: "#f0ede8",
              border: "1px solid #e8e4df",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#e8e4df";
              el.style.color = "#1e2a4a";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#f0ede8";
              el.style.color = "#8896a4";
            }}
          >
            ← 回首頁
          </Link>
        </div>

        {/* Page title */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 28px)",
              fontWeight: 700,
              color: "#1e2a4a",
              margin: "0 0 6px",
              letterSpacing: "-0.015em",
            }}
          >
            我的帳號
          </h1>
          <p style={{ color: "#8896a4", fontSize: "14px", margin: 0 }}>
            {user?.email}
          </p>
        </div>

        {/* Profile card */}
        <div style={cardStyle}>
          <p style={SECTION_LABEL}>帳號資訊</p>

          <div style={{ ...INFO_ROW, marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", color: "#8896a4" }}>身份</span>
            <span
              style={{
                background: roleStyle.bg,
                color: roleStyle.color,
                border: `1px solid ${roleStyle.border}`,
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 11px",
                borderRadius: "999px",
                letterSpacing: "0.03em",
              }}
            >
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>

          <div style={INFO_ROW}>
            <span style={{ fontSize: "14px", color: "#8896a4" }}>顯示名稱</span>
            <span style={{ fontSize: "14px", color: "#4a5568", fontWeight: 500 }}>
              {profile?.display_name || "（尚未設定）"}
            </span>
          </div>
        </div>

        {/* Teacher status card */}
        <div style={cardStyle}>
          <p style={SECTION_LABEL}>老師申請</p>

          {teacherStatus === "none" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#8896a4" }}>
                尚未申請老師身份
              </p>
              <Link
                href="/become-teacher"
                onMouseEnter={() => setApplyHovered(true)}
                onMouseLeave={() => setApplyHovered(false)}
                style={{
                  flexShrink: 0,
                  display: "inline-block",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: applyHovered ? "#6d28d9" : "#7c3aed",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                申請成為老師
              </Link>
            </div>
          )}

          {teacherStatus === "pending" && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#4a5568" }}>
                審核中
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#8896a4" }}>
                管理員會盡快審核你的申請。
              </p>
            </div>
          )}

          {teacherStatus === "approved" && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#059669" }}>
                已成為老師
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#8896a4" }}>
                你的老師身份已通過審核。
              </p>
              <div
                style={{
                  padding: "11px 14px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                  fontSize: "13px",
                  color: "#059669",
                }}
              >
                ✓ 老師功能即將開放，敬請期待。
              </div>
            </div>
          )}

          {teacherStatus === "rejected" && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#dc2626" }}>
                  申請未通過
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#8896a4" }}>
                  可修改自我介紹後重新申請。
                </p>
              </div>
              <Link
                href="/become-teacher"
                style={{
                  flexShrink: 0,
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid #fca5a5",
                  whiteSpace: "nowrap",
                }}
              >
                重新申請
              </Link>
            </div>
          )}
        </div>

        {/* Wallet card */}
        <div style={cardStyle}>
          <p style={SECTION_LABEL}>代幣餘額</p>

          <div style={{ display: "flex", gap: "14px" }}>
            <div
              style={{
                flex: 1,
                background: "#fdf8ee",
                border: "1px solid #f5e6c8",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#a07030", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                免費代幣
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#1e2a4a",
                }}
              >
                {wallet?.free_tokens ?? 0}
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "#f5f3ff",
                border: "1px solid #ede9fe",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                付費代幣
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#7c3aed",
                }}
              >
                {wallet?.paid_tokens ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: `1px solid ${logoutHovered ? "#fca5a5" : "#e8e4df"}`,
            background: logoutHovered ? "#fef2f2" : "#ffffff",
            color: logoutHovered ? "#dc2626" : "#8896a4",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
        >
          登出
        </button>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid #e8e4df",
  boxShadow: "0 2px 8px rgba(30, 42, 74, 0.06)",
  marginBottom: "14px",
};
