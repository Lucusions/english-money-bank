"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { getSupabaseBrowser } from "../lib/supabase-browser";

const FEATURES = [
  {
    num: "01",
    title: "海量英文題庫",
    desc: "涵蓋會考、學測、TOEIC、GEPT，精選高品質試題，隨時關鍵字搜尋複習。",
    color: "#3b6fd4",
    bg: "#eef2fb",
  },
  {
    num: "02",
    title: "閱讀題組",
    desc: "文章與題目一體呈現，模擬真實考試場景，系統化訓練閱讀理解能力。",
    color: "#059669",
    bg: "#ecfdf5",
  },
  {
    num: "03",
    title: "老師詳解",
    desc: "認證教師撰寫深度解析，理解每題考點思路，不只記答案更懂得舉一反三。",
    color: "#c9a84c",
    bg: "#fdf8ee",
  },
  {
    num: "04",
    title: "智慧練習",
    desc: "自訂題目範圍與難度，針對弱點精準出題，讓每一分備考時間發揮最大效益。",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
];

const EXAMS = [
  { label: "國中會考", desc: "基礎英語單字與閱讀", level: "基礎" },
  { label: "學測 / 指考", desc: "大學入學英文全真題", level: "進階" },
  { label: "TOEIC", desc: "多益職場英語情境題", level: "職場" },
  { label: "GEPT", desc: "全民英語能力檢定", level: "全級" },
];

const STATS = [
  { number: "5,000+", label: "精選題目" },
  { number: "200+",   label: "閱讀篇章" },
  { number: "50+",    label: "認證教師" },
  { number: "98%",    label: "學生好評" },
];

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === "admin") setIsAdmin(true);
        });
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        fontFamily: "var(--font-body)",
      }}
    >
      <Navbar darkHero />

      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(150deg, #131c35 0%, #1e2a4a 45%, #1a3558 100%)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 100px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative rings */}
        <div style={ring(480, "top: 8%; right: -80px", 0.12)} />
        <div style={ring(320, "top: 14%; right: -20px", 0.07)} />
        <div style={ring(360, "bottom: 4%; left: -100px", 0.06)} />
        <div style={ring(220, "bottom: 10%; left: -40px", 0.09)} />

        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(201, 168, 76, 0.12)",
            border: "1px solid rgba(201, 168, 76, 0.28)",
            borderRadius: "999px",
            padding: "6px 18px",
            marginBottom: "36px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#c9a84c",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            英文備考平台 · Beta
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 6.5vw, 76px)",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.12,
            marginBottom: "28px",
            letterSpacing: "-0.025em",
            maxWidth: "820px",
          }}
        >
          精準備考，
          <br />
          <span style={{ color: "#c9a84c" }}>輕鬆突破</span>英文瓶頸
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: "rgba(255, 255, 255, 0.65)",
            fontSize: "18px",
            lineHeight: 1.75,
            maxWidth: "520px",
            marginBottom: "48px",
          }}
        >
          海量精選題庫，搭配閱讀題組與老師詳解，
          <br />
          從單字到閱讀理解，一站式提升英文實力。
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <HeroBtn href="/search" primary>
            開始搜尋題庫
          </HeroBtn>
          <HeroBtn href="/practice-builder">
            探索練習模式
          </HeroBtn>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            向下探索
          </span>
          <div
            style={{
              width: "1px",
              height: "28px",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
            }}
          />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #f0ede8",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "36px 16px",
                borderRight: i < STATS.length - 1 ? "1px solid #f0ede8" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "38px",
                  fontWeight: 700,
                  color: "#1e2a4a",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {s.number}
              </div>
              <div style={{ fontSize: "13px", color: "#8896a4", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 24px", background: "#faf8f5" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Platform Features"
            eyebrowColor="#c9a84c"
            eyebrowBg="#fdf8ee"
            eyebrowBorder="#f5e6c8"
            title="完整的英文備考工具"
            subtitle="從題庫搜尋到老師詳解，每一個功能都為了幫助你更有效率地準備考試。"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {FEATURES.map((f) => (
              <FeatureCard key={f.num} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Exam Categories ── */}
      <section style={{ padding: "100px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Exam Categories"
            eyebrowColor="#3b6fd4"
            eyebrowBg="#eef2fb"
            eyebrowBorder="#c7d9f5"
            title="涵蓋各大英語考試"
            subtitle="題庫精心分類，對應你正在準備的考試，快速找到最相關的練習題。"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {EXAMS.map((e) => (
              <ExamCard key={e.label} {...e} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e2a4a 0%, #2d3f6e 100%)",
          padding: "88px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 38px)",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "16px",
              letterSpacing: "-0.015em",
            }}
          >
            準備好開始了嗎？
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.60)",
              fontSize: "16px",
              marginBottom: "40px",
              lineHeight: 1.75,
            }}
          >
            立即探索題庫，找到適合你程度的練習題。
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <HeroBtn href="/search" primary>搜尋題庫</HeroBtn>
            <HeroBtn href="/login">免費註冊</HeroBtn>
          </div>
          {isAdmin && (
            <div style={{ marginTop: "28px" }}>
              <Link
                href="/bulk-import"
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.65)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
              >
                管理員：批量匯入題目
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "#111827",
          padding: "48px 24px 32px",
        }}
      >
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "linear-gradient(135deg, #2d3f6e 0%, #3b6fd4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c9a84c",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              E
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              EduBank
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "28px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            {[
              { href: "/search", label: "題庫搜尋" },
              { href: "/practice-builder", label: "練習模式" },
              { href: "/reading", label: "閱讀題組" },
              { href: "/become-teacher", label: "成為老師" },
              { href: "/quick-import", label: "快速匯入" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
              >
                {label}
              </Link>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: "12px" }}>
            © 2025 EduBank · 英文備考平台 · 保留所有權利
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  eyebrowColor,
  eyebrowBg,
  eyebrowBorder,
  title,
  subtitle,
}: {
  eyebrow: string;
  eyebrowColor: string;
  eyebrowBg: string;
  eyebrowBorder: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: "60px" }}>
      <div
        style={{
          display: "inline-block",
          background: eyebrowBg,
          color: eyebrowColor,
          fontSize: "11px",
          fontWeight: 700,
          padding: "5px 14px",
          borderRadius: "999px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "18px",
          border: `1px solid ${eyebrowBorder}`,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(26px, 4vw, 40px)",
          fontWeight: 700,
          color: "#1e2a4a",
          marginBottom: "16px",
          letterSpacing: "-0.015em",
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#8896a4",
          fontSize: "16px",
          maxWidth: "460px",
          margin: "0 auto",
          lineHeight: 1.75,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({
  num,
  title,
  desc,
  color,
  bg,
}: {
  num: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e4df",
        borderRadius: "20px",
        padding: "32px 28px",
        boxShadow: "0 4px 16px rgba(30, 42, 74, 0.06)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 40px rgba(30, 42, 74, 0.11)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(30, 42, 74, 0.06)";
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          background: bg,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "13px",
            fontWeight: 700,
            color: color,
            letterSpacing: "0.04em",
          }}
        >
          {num}
        </span>
      </div>
      <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e2a4a", marginBottom: "10px" }}>
        {title}
      </h3>
      <p style={{ color: "#8896a4", fontSize: "14px", lineHeight: 1.75 }}>
        {desc}
      </p>
    </div>
  );
}

function ExamCard({
  label,
  desc,
  level,
}: {
  label: string;
  desc: string;
  level: string;
}) {
  return (
    <Link
      href="/search"
      style={{
        background: "#faf8f5",
        border: "1px solid #e8e4df",
        borderRadius: "16px",
        padding: "28px 22px",
        textDecoration: "none",
        display: "block",
        transition: "background 0.18s, border-color 0.18s, transform 0.18s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "#f0ede8";
        el.style.borderColor = "#c9a84c";
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "#faf8f5";
        el.style.borderColor = "#e8e4df";
        el.style.transform = "translateY(0)";
      }}
    >
      <span
        style={{
          display: "inline-block",
          background: "#fdf8ee",
          color: "#c9a84c",
          fontSize: "11px",
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: "999px",
          marginBottom: "12px",
          border: "1px solid #f5e6c8",
          letterSpacing: "0.04em",
        }}
      >
        {level}
      </span>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e2a4a", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", color: "#8896a4", lineHeight: 1.6 }}>
        {desc}
      </div>
    </Link>
  );
}

function HeroBtn({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "14px 34px",
        borderRadius: "10px",
        background: primary ? "#c9a84c" : "rgba(255,255,255,0.12)",
        border: primary ? "none" : "1px solid rgba(255,255,255,0.22)",
        color: primary ? "#1e2a4a" : "#ffffff",
        fontSize: "15px",
        fontWeight: primary ? 700 : 600,
        textDecoration: "none",
        letterSpacing: "0.01em",
        backdropFilter: primary ? "none" : "blur(8px)",
        transition: "background 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = primary ? "#b8943e" : "rgba(255,255,255,0.2)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = primary ? "#c9a84c" : "rgba(255,255,255,0.12)";
        el.style.transform = "translateY(0)";
      }}
    >
      {children}
    </Link>
  );
}

/* helper: decorative ring style */
function ring(
  size: number,
  position: string,
  opacity: number
): React.CSSProperties {
  const pos: Record<string, string> = {};
  position.split("; ").forEach((p) => {
    const [k, v] = p.split(": ");
    pos[k.trim()] = v.trim();
  });
  return {
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    border: `1px solid rgba(201, 168, 76, ${opacity})`,
    pointerEvents: "none",
    ...pos,
  };
}
