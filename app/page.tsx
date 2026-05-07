import Link from "next/link";
import AuthButton from "../components/AuthButton";

const CARDS = [
  {
    href: "/search",
    icon: "🔍",
    title: "題庫搜尋",
    desc: "輸入關鍵字，即時搜尋單選題，預覽題目與答案。",
    cta: "前往搜尋",
  },
  {
    href: "/practice-builder",
    icon: "✏️",
    title: "開始練習",
    desc: "隨機生成練習題組，即時作答並查看成績。",
    cta: "開始練習",
  },
  {
    href: "/quick-import",
    icon: "📥",
    title: "快速匯入",
    desc: "貼上考試文字，自動解析題目並匯入題庫。",
    cta: "前往匯入",
  },
  {
    href: "/bulk-import",
    icon: "🗂️",
    title: "JSON 批次匯入",
    desc: "上傳 JSON 檔案，批次匯入大量題目至題庫。",
    cta: "JSON 批次匯入",
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px 80px",
        fontFamily: "'Inter', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <AuthButton />
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "52px" }}>
        <span
          style={{
            display: "inline-block",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "999px",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Beta
        </span>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 14px",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          英文題庫系統
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: "17px",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          建立、搜尋、練習你的英文題庫
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          width: "100%",
          maxWidth: "860px",
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.href}
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "32px 28px",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.07)",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: "0",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "16px",
                lineHeight: 1,
              }}
            >
              {card.icon}
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 10px",
              }}
            >
              {card.title}
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: "0 0 24px",
                lineHeight: 1.65,
                flex: 1,
              }}
            >
              {card.desc}
            </p>
            <Link
              href={card.href}
              style={{
                display: "block",
                padding: "11px 0",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
                letterSpacing: "0.01em",
              }}
            >
              {card.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: "52px",
          color: "#d1d5db",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        英文題庫系統 · Beta
      </p>
    </main>
  );
}
