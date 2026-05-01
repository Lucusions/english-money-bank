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
          gap: "5px",
          padding: "7px 14px",
          borderRadius: "8px",
          background: "#2563eb",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 1px 6px rgba(15, 23, 42, 0.18)",
          letterSpacing: "0.01em",
        }}
      >
        {isLoggedIn ? "👤 我的帳號" : "登入 / 註冊"}
      </Link>
    </div>
  );
}
