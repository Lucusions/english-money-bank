"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 請把這裡換成你自己的正確值
const supabase = createClient(
  "https://qudiibuyqrpzxvejuerp.supabase.co",
  "sb_publishable_wb1Pq6UjhHYXYUlGbz5WNw_hV3RW7NU"
);

type Option = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
};

type Question = {
  id: string;
  body: string;
  options: {
    id: string;
    text: string;
    is_correct: boolean;
  }[];
};

export default function ReadingPage() {
  const [passage, setPassage] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState("載入中...");

  useEffect(() => {
    fetchReadingSet();
  }, []);

  async function fetchReadingSet() {
    try {
      setStatus("載入中...");

      // ① 抓最新一筆 passage
      const { data: passages, error: pError } = await supabase
        .from("passages")
        .select("id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (pError) {
        console.error("抓 passage 失敗:", pError);
        setStatus("抓文章失敗");
        return;
      }

      if (!passages || passages.length === 0) {
        console.log("沒有 passage 資料");
        setPassage("");
        setQuestions([]);
        setStatus("目前沒有閱讀題組資料");
        return;
      }

      const p = passages[0];
      setPassage(p.content || "");

      // ② 抓該 passage 的題目
      const { data: qs, error: qError } = await supabase
        .from("questions")
        .select("id, body")
        .eq("passage_id", p.id)
        .order("created_at", { ascending: true });

      if (qError) {
        console.error("抓題目失敗:", qError);
        setQuestions([]);
        setStatus("抓題目失敗");
        return;
      }

      if (!qs || qs.length === 0) {
        console.log("這篇文章沒有綁到題目");
        setQuestions([]);
        setStatus("有文章，但沒有綁到題目");
        return;
      }

      const questionIds = qs.map((q) => q.id);

      // ③ 抓這些題目的選項
      const { data: opts, error: oError } = await supabase
        .from("options")
        .select("id, question_id, text, is_correct")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true });

      if (oError) {
        console.error("抓選項失敗:", oError);
        setQuestions([]);
        setStatus("抓選項失敗");
        return;
      }

      const optionMap: Record<string, Option[]> = {};

      (opts || []).forEach((opt: Option) => {
        if (!optionMap[opt.question_id]) {
          optionMap[opt.question_id] = [];
        }
        optionMap[opt.question_id].push(opt);
      });

      const combined: Question[] = qs.map((q) => ({
        id: q.id,
        body: q.body,
        options: (optionMap[q.id] || []).map((opt) => ({
          id: opt.id,
          text: opt.text,
          is_correct: opt.is_correct,
        })),
      }));

      setQuestions(combined);
      setStatus("載入完成");
    } catch (error) {
      console.error("reading page error:", error);
      setStatus("系統錯誤");
    }
  }

  function selectOption(qid: string, oid: string) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [qid]: oid,
    }));
  }

  function submit() {
    let correct = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      const right = q.options.find((o) => o.is_correct);

      if (selected && right && selected === right.id) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);
  }

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    fetchReadingSet();
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        📖 閱讀測驗
      </h1>

      <div
        style={{
          marginBottom: "14px",
          fontSize: "14px",
          color: "#666",
        }}
      >
        狀態：{status}
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
        }}
      >
        {passage || "（目前沒有文章）"}
      </div>

      {questions.length === 0 && (
        <div
          style={{
            marginBottom: "20px",
            background: "#fff7ed",
            color: "#9a3412",
            padding: "14px 16px",
            borderRadius: "10px",
          }}
        >
          ⚠️ 沒有抓到題目。  
          這通常表示：
          <br />
          1. passages 有資料，但 questions.passage_id 沒綁到  
          <br />
          2. 或 options 沒有綁到 question_id
        </div>
      )}

      {questions.map((q, index) => (
        <div
          key={q.id}
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "12px" }}>
            {index + 1}. {q.body}
          </p>

          {q.options.map((opt) => {
            const selected = answers[q.id];
            const isSelected = selected === opt.id;

            let bg = "#f3f4f6";

            if (submitted) {
              if (opt.is_correct) bg = "#bbf7d0";
              else if (isSelected) bg = "#fecaca";
            } else if (isSelected) {
              bg = "#bfdbfe";
            }

            return (
              <div
                key={opt.id}
                onClick={() => selectOption(q.id, opt.id)}
                style={{
                  padding: "10px 12px",
                  marginTop: "8px",
                  borderRadius: "8px",
                  cursor: submitted ? "default" : "pointer",
                  background: bg,
                }}
              >
                {opt.text}
              </div>
            );
          })}
        </div>
      ))}

      {!submitted && questions.length > 0 && (
        <button
          onClick={submit}
          style={{
            padding: "12px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          交卷
        </button>
      )}

      {submitted && score !== null && (
        <div
          style={{
            marginTop: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          得分：{score} / {questions.length}
        </div>
      )}

      <button
        onClick={resetQuiz}
        style={{
          padding: "12px 20px",
          background: "#374151",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          marginTop: "16px",
        }}
      >
        重新載入題組
      </button>
    </main>
  );
}