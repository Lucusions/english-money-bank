"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "../lib/supabase-browser";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session?.user);
        setReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return (
    <div style={{ position: "fixed", top: "16px", right: "20px", zIndex: 50 }}>
      <Link
        href={isLoggedIn ? "/account" : "/login"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "7px 16px",
          borderRadius: "8px",
          background: "#1e2a4a",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 2px 8px rgba(30, 42, 74, 0.20)",
          letterSpacing: "0.01em",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#2d3f6e";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#1e2a4a";
        }}
      >
        {isLoggedIn ? "我的帳號" : "登入 / 註冊"}
      </Link>
    </div>
  );
}
