import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseQuestionText } from "@/lib/question-parser";
import type { ParsedQuestion } from "@/lib/question-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleImport(items: ParsedQuestion[]) {
  const warnings: string[] = [];
  const insertedIds: string[] = [];
  let skippedCount = 0;

  const candidates = items.filter((q) => q.type === "single_choice");

  for (const q of candidates) {
    const label = q.question_no != null ? `第 ${q.question_no} 題` : `題目「${q.question.body.slice(0, 20)}…」`;

    if (!q.options || q.options.length < 2) {
      warnings.push(`${label}：選項少於 2 個，略過`);
      skippedCount++;
      continue;
    }

    const correctOptions = q.options.filter((o) => o.is_correct);
    if (correctOptions.length !== 1) {
      warnings.push(
        `${label}：正解數量為 ${correctOptions.length}（應為 1），略過`
      );
      skippedCount++;
      continue;
    }

    const { data: inserted, error: qError } = await supabase
      .from("questions")
      .insert({
        body: q.question.body.trim(),
        type: "single",
        difficulty: q.question.difficulty || "medium",
        question_no: q.question_no ?? null,
      })
      .select("id")
      .single();

    if (qError || !inserted) {
      warnings.push(`${label}：寫入題目失敗 — ${qError?.message ?? "unknown"}`);
      skippedCount++;
      continue;
    }

    const questionId = inserted.id;

    const optionRows = q.options.map((o, idx) => ({
      question_id: questionId,
      label: o.label ?? null,
      text: o.text,
      is_correct: o.is_correct,
      sort_order: idx,
    }));

    const { error: optError } = await supabase.from("options").insert(optionRows);

    if (optError) {
      warnings.push(`${label}：選項寫入失敗 — ${optError.message}，題目已寫入但選項遺失`);
    }

    insertedIds.push(questionId);
  }

  return {
    inserted_count: insertedIds.length,
    skipped_count: skippedCount,
    warnings,
    inserted_ids: insertedIds,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body;

    if (mode === "parse") {
      const { text, answers } = body;

      if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "請提供題目文字" }, { status: 400 });
      }

      const { data, sectionCount } = parseQuestionText(text, answers || "");

      return NextResponse.json({
        data,
        count: data.length,
        section_count: sectionCount,
      });
    }

    if (mode === "import") {
      const { data } = body;

      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: "請提供解析後的題目陣列" }, { status: 400 });
      }

      const result = await handleImport(data as ParsedQuestion[]);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "mode錯誤" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "操作失敗" },
      { status: 500 }
    );
  }
}
