import Link from "next/link";

export default function Home() {
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
          borderRadius: "20px",
          padding: "52px 44px",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)",
          textAlign: "center",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: "999px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Beta
        </span>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 10px",
            lineHeight: 1.3,
          }}
        >
          英文題庫系統
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "15px",
            margin: "0 0 36px",
            lineHeight: 1.6,
          }}
        >
          搜尋題目、隨機練習，逐步建立你的英文題庫平台。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link
            href="/search"
            style={{
              display: "block",
              padding: "14px",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            前往搜尋
          </Link>

          <Link
            href="/practice-builder"
            style={{
              display: "block",
              padding: "14px",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#2563eb",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1.5px solid #2563eb",
              transition: "background 0.15s",
            }}
          >
            開始練習
          </Link>
        </div>
      </div>
    </main>
  );
}
