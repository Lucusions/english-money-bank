import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Maps Chinese category labels (or already-correct English) to the PG enum value
const CATEGORY_MAP: Record<string, string> = {
  文法: "grammar",
  grammar: "grammar",
  單字: "vocabulary",
  vocabulary: "vocabulary",
  閱讀: "reading",
  克漏字: "reading",
  reading: "reading",
  會考: "source",
  學測: "source",
  TOEIC: "source",
  單選: "source",
  source: "source",
  "2000單": "level",
  "4000單": "level",
  "7000單": "level",
  簡單: "level",
  中等: "level",
  困難: "level",
  level: "level",
};

interface RawItem {
  question: { body: string; type?: string; difficulty?: string };
  options: { text: string; is_correct: boolean }[];
  tags?: { name: string; category: string }[];
}

async function findOrCreateTag(name: string, category: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error: insErr } = await supabase
    .from("tags")
    .insert({ name, category })
    .select("id")
    .maybeSingle();
  if (created) return created.id as string;

  // Race condition — retry
  if (insErr?.code === "23505") {
    const { data: retry } = await supabase
      .from("tags")
      .select("id")
      .eq("name", name)
      .eq("category", category)
      .maybeSingle();
    if (retry) return retry.id as string;
  }

  return null;
}

async function importOne(item: RawItem, index: number): Promise<{ ok: boolean; error?: string }> {
  const label = `第 ${index + 1} 題`;

  // ── Validate question ─────────────────────────────────────────
  if (!item.question?.body?.trim()) {
    return { ok: false, error: `${label}：缺少 question.body` };
  }

  // ── Validate options ──────────────────────────────────────────
  if (!Array.isArray(item.options) || item.options.length < 2) {
    return { ok: false, error: `${label}：選項少於 2 個` };
  }
  const correctCount = item.options.filter((o) => o.is_correct === true).length;
  if (correctCount !== 1) {
    return { ok: false, error: `${label}：is_correct = true 的選項應為 1 個，目前 ${correctCount} 個` };
  }

  // ── Insert question ───────────────────────────────────────────
  const { data: inserted, error: qErr } = await supabase
    .from("questions")
    .insert({
      body: item.question.body.trim(),
      type: item.question.type ?? "single",
      difficulty: item.question.difficulty ?? "medium",
    })
    .select("id")
    .single();

  if (qErr || !inserted) {
    return { ok: false, error: `${label}：questions 寫入失敗 — ${qErr?.message ?? "unknown"}` };
  }

  const questionId = inserted.id as string;

  // ── Insert options ────────────────────────────────────────────
  const optionRows = item.options.map((o, idx) => ({
    question_id: questionId,
    text: o.text,
    is_correct: o.is_correct,
    sort_order: idx,
  }));

  const { error: optErr } = await supabase.from("options").insert(optionRows);
  if (optErr) {
    return { ok: false, error: `${label}：options 寫入失敗 — ${optErr.message}` };
  }

  // ── Insert tags ───────────────────────────────────────────────
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    for (const tag of item.tags) {
      const resolvedCategory = CATEGORY_MAP[tag.category] ?? CATEGORY_MAP[tag.name] ?? tag.category;
      const tagId = await findOrCreateTag(tag.name, resolvedCategory);
      if (!tagId) continue;

      await supabase
        .from("question_tags")
        .insert({ question_id: questionId, tag_id: tagId });
      // ignore duplicate errors (23505) — already linked is fine
    }
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!token) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  let items: unknown;
  try {
    items = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "請提供非空陣列" }, { status: 400 });
  }

  const failed: { index: number; error: string }[] = [];
  let inserted_questions = 0;

  for (let i = 0; i < items.length; i++) {
    const result = await importOne(items[i] as RawItem, i);
    if (result.ok) {
      inserted_questions++;
    } else {
      failed.push({ index: i, error: result.error ?? "未知錯誤" });
    }
  }

  return NextResponse.json({ success: true, inserted_questions, failed });
}
