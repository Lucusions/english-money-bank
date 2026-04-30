const fs = require("fs");

async function run() {
  try {
    console.log("開始匯入...");

    const raw = fs.readFileSync("./questions.json", "utf-8");
    const data = JSON.parse(raw);

    console.log("讀到題目數量：", data.length);

    const res = await fetch("http://localhost:3000/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("API 回應狀態：", res.status);

    const text = await res.text();
    console.log("API 原始回應：", text);
  } catch (err) {
    console.error("錯誤：", err);
  }
}

run();