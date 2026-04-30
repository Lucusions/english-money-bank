"use client";

import { useState } from "react";

export default function ImportPage() {
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");

  async function handleImport() {
    try {
      const parsed = JSON.parse(json);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const result = await res.json();

      if (result.success) {
        setMsg("匯入成功");
      } else {
        setMsg("匯入失敗");
      }
    } catch {
      setMsg("JSON 格式錯誤");
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>題庫匯入</h1>

      <textarea
        rows={20}
        style={{ width: "100%", marginBottom: 10 }}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder="貼上 JSON"
      />

      <button onClick={handleImport}>匯入</button>

      <p>{msg}</p>
    </main>
  );
}