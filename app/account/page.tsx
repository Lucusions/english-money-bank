"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

const ROLE_LABEL: Record<string, string> = {
  student: "學生",
  teacher: "老師",
  admin: "管理員",
};

const ROLE_COLOR: Record<string, string> = {
  student: "#2563eb",
  teacher: "#7c3aed",
  admin: "#dc2626",
};

const ROLE_BG: Record<string, string> = {
  student: "#eff6ff",
  teacher: "#f5f3ff",
  admin: "#fef2f2",
};

const TEACHER_STATUS_LABEL: Record<string, string> = {
  none: "尚未申請",
  pending: "審核中",
  approved: "已通過",
  rejected: "未通過",
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

      if (!user) {
        router.push("/login");
        return;
      }

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
          background: "#f6f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <p style={{ color: "#9ca3af", fontSize: "15px" }}>載入中…</p>
      </main>
    );
  }

  const teacherStatus = profile?.teacher_status ?? "none";
  const role = teacherStatus === "approved" ? "teacher" : (profile?.role ?? "student");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "48px 20px 80px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Back */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/"
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
            ← 回首頁
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 6px",
            }}
          >
            我的帳號
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
            {user?.email}
          </p>
        </div>

        {/* Profile card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.07)",
            border: "1px solid #e5e7eb",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            帳號資訊
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#6b7280" }}>身份</span>
            <span
              style={{
                background: ROLE_BG[role] ?? "#f9fafb",
                color: ROLE_COLOR[role] ?? "#374151",
                fontSize: "13px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "14px", color: "#6b7280" }}>顯示名稱</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>
              {profile?.display_name || "（尚未設定）"}
            </span>
          </div>
        </div>

        {/* Teacher status card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.07)",
            border: "1px solid #e5e7eb",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            老師申請
          </p>

          {teacherStatus === "none" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                尚未申請老師身份
              </p>
              <Link
                href="/become-teacher"
                onMouseEnter={() => setApplyHovered(true)}
                onMouseLeave={() => setApplyHovered(false)}
                style={{
                  flexShrink: 0,
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: applyHovered ? "#6d28d9" : "#7c3aed",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap" as const,
                }}
              >
                申請成為老師
              </Link>
            </div>
          )}

          {teacherStatus === "pending" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⏳</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                  審核中
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>
                  管理員會盡快審核你的申請。
                </p>
              </div>
            </div>
          )}

          {teacherStatus === "approved" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🎓</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#15803d" }}>
                  已成為老師
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>
                  你的老師身份已通過審核。
                </p>
              </div>
            </div>
          )}

          {teacherStatus === "rejected" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>❌</span>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#dc2626" }}>
                    申請未通過
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>
                    你可以修改自我介紹後重新申請。
                  </p>
                </div>
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
                  whiteSpace: "nowrap" as const,
                }}
              >
                重新申請
              </Link>
            </div>
          )}

          {teacherStatus === "approved" && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "13px",
                color: "#15803d",
              }}
            >
              ✓ 老師功能即將開放，敬請期待。
            </div>
          )}
        </div>

        {/* Wallet card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.07)",
            border: "1px solid #e5e7eb",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            代幣餘額
          </p>

          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                flex: 1,
                background: "#eff6ff",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6b7280" }}>
                免費代幣
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#2563eb",
                }}
              >
                {wallet?.free_tokens ?? 0}
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "#f5f3ff",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6b7280" }}>
                付費代幣
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 800,
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
            padding: "13px",
            borderRadius: "10px",
            border: "1.5px solid #e5e7eb",
            background: logoutHovered ? "#fef2f2" : "#ffffff",
            color: logoutHovered ? "#dc2626" : "#6b7280",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            borderColor: logoutHovered ? "#fca5a5" : "#e5e7eb",
          }}
        >
          登出
        </button>
      </div>
    </main>
  );
}
