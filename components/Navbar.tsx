"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "../lib/supabase-browser";

interface NavbarProps {
  /** When true the navbar sits over a dark hero and starts transparent */
  darkHero?: boolean;
}

const NAV_LINKS = [
  { href: "/search",           label: "題庫搜尋" },
  { href: "/practice-builder", label: "練習模式" },
];

export default function Navbar({ darkHero = false }: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !darkHero || scrolled;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "64px",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        background: solid ? "rgba(255, 255, 255, 0.97)" : "transparent",
        backdropFilter: solid ? "blur(14px)" : "none",
        borderBottom: solid ? "1px solid rgba(232, 228, 223, 0.9)" : "none",
        boxShadow: solid ? "0 2px 12px rgba(30, 42, 74, 0.06)" : "none",
        transition: "background 0.3s, box-shadow 0.3s, border-bottom 0.3s",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          textDecoration: "none",
          marginRight: "auto",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9px",
            background: "linear-gradient(135deg, #1e2a4a 0%, #3b6fd4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c9a84c",
            fontSize: "15px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          E
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: 700,
            color: solid ? "#1e2a4a" : "#ffffff",
            letterSpacing: "-0.01em",
            transition: "color 0.3s",
          }}
        >
          EduBank
        </span>
      </Link>

      {/* Desktop nav links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          marginRight: "20px",
        }}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} solid={solid} />
        ))}
      </div>

      {/* Auth CTA */}
      {ready && (
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 20px",
            borderRadius: "8px",
            background: solid ? "#1e2a4a" : "rgba(255,255,255,0.15)",
            border: solid ? "none" : "1px solid rgba(255,255,255,0.3)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.01em",
            backdropFilter: solid ? "none" : "blur(8px)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = solid ? "#2d3f6e" : "rgba(255,255,255,0.22)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = solid ? "#1e2a4a" : "rgba(255,255,255,0.15)";
          }}
        >
          {isLoggedIn ? "我的帳號" : "登入 / 註冊"}
        </Link>
      )}
    </nav>
  );
}

function NavLink({ href, label, solid }: { href: string; label: string; solid: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 13px",
        borderRadius: "7px",
        color: solid ? "#4a5568" : "rgba(255,255,255,0.8)",
        fontSize: "14px",
        fontWeight: 500,
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = solid ? "#f0ede8" : "rgba(255,255,255,0.1)";
        el.style.color = solid ? "#1e2a4a" : "#ffffff";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "transparent";
        el.style.color = solid ? "#4a5568" : "rgba(255,255,255,0.8)";
      }}
    >
      {label}
    </Link>
  );
}
