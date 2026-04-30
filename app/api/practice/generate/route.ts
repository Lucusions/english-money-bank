import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = Math.min(Math.max(Number(body?.count) || 10, 1), 50);

    const { data: pool, error: poolError } = await supabase
      .from("questions")
      .select("id, body, difficulty, question_no")
      .in("type", ["single", "single_choice"])
      .limit(200);

    if (poolError) {
      return NextResponse.json({ error: poolError.message }, { status: 400 });
    }

    if (!pool || pool.length === 0) {
      return NextResponse.json({ error: "題庫中沒有單選題" }, { status: 404 });
    }

    const shuffled = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    const ids = shuffled.map((q: any) => q.id);

    const { data: options, error: optionsError } = await supabase
      .from("options")
      .select("id, question_id, label, text, is_correct, sort_order")
      .in("question_id", ids)
      .order("sort_order");

    if (optionsError) {
      return NextResponse.json({ error: optionsError.message }, { status: 400 });
    }

    const optMap = (options ?? []).reduce(
      (acc: Record<string, any[]>, o: any) => {
        (acc[o.question_id] ||= []).push(o);
        return acc;
      },
      {}
    );

    const questions = shuffled.map((q: any) => ({
      id: q.id,
      body: q.body,
      difficulty: q.difficulty,
      question_no: q.question_no,
      options: (optMap[q.id] ?? []).map((o: any) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        is_correct: o.is_correct,
        sort_order: o.sort_order,
      })),
    }));

    return NextResponse.json({ questions, count: questions.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "生成失敗" },
      { status: 500 }
    );
  }
}
