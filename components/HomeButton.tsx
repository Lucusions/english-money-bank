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
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
          transition: "background 0.12s, color 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#e5e7eb";
          (e.currentTarget as HTMLAnchorElement).style.color = "#111827";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#f3f4f6";
          (e.currentTarget as HTMLAnchorElement).style.color = "#6b7280";
        }}
      >
        ← 回首頁
      </Link>
    </div>
  );
}
