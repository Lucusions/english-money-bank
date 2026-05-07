"use client";

import Link from "next/link";

export default function HomeButton() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#8896a4",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          padding: "6px 13px",
          borderRadius: "8px",
          background: "#f0ede8",
          border: "1px solid #e8e4df",
          letterSpacing: "0.01em",
          transition: "background 0.12s, color 0.12s",
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
  );
}
