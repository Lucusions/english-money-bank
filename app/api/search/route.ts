import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { keyword, tag_ids, difficulty, type, limit = 20, offset = 0 } =
    await req.json();

  const { data, error } = await supabase.rpc("search_questions", {
    keyword: keyword && keyword.length > 0 ? keyword : null,
    tag_ids: tag_ids ?? null,
    diff: difficulty ?? null,
    qtype: type ?? null,
    lim: limit,
    offs: offset,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ data: [], count: 0 });
  }

  const questionIds = data.map((q: { id: string }) => q.id);

  const { data: options, error: optionsError } = await supabase
    .from("options")
    .select("id, question_id, text, sort_order, is_correct")
    .in("question_id", questionIds)
    .order("sort_order");

  if (optionsError) {
    return NextResponse.json({ error: optionsError.message }, { status: 400 });
  }

  const optMap = (options ?? []).reduce((acc: Record<string, any[]>, o: any) => {
    (acc[o.question_id] ||= []).push(o);
    return acc;
  }, {});

  const result = data.map((q: any) => ({
    ...q,
    options: (optMap[q.id] ?? []).map((o: any) => ({
      id: o.id,
      text: o.text,
      sort_order: o.sort_order,
      is_correct: o.is_correct,
    })),
    tags: [],
  }));

  return NextResponse.json({ data: result, count: result.length });
}
