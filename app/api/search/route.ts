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

  // Collect non-null group_ids from matched results
  const groupIds = [...new Set(
    (data as any[]).map((q: any) => q.group_id).filter(Boolean)
  )] as string[];

  // Fetch all questions belonging to those groups
  let groupQuestions: any[] = [];
  if (groupIds.length > 0) {
    const { data: gq } = await supabase
      .from("questions")
      .select("id, body, type, difficulty, group_id, group_title, group_order")
      .in("group_id", groupIds);
    groupQuestions = gq ?? [];
  }

  // Merge: original results + group expansion, deduplicated by id
  const seen = new Set<string>();
  const merged: any[] = [];
  for (const q of data as any[]) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      merged.push({ ...q, _originalIndex: merged.length });
    }
  }
  for (const q of groupQuestions) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      merged.push({ ...q, _originalIndex: merged.length });
    }
  }

  // Sort: grouped questions by (group_id, group_order); singles keep original order
  merged.sort((a, b) => {
    const aG = !!a.group_id;
    const bG = !!b.group_id;
    if (aG && bG) {
      if (a.group_id !== b.group_id) return a.group_id.localeCompare(b.group_id);
      return (a.group_order ?? 0) - (b.group_order ?? 0);
    }
    if (aG) return -1;
    if (bG) return 1;
    return a._originalIndex - b._originalIndex;
  });

  const questionIds = merged.map((q: any) => q.id);

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

  const result = merged.map((q: any) => ({
    id: q.id,
    body: q.body,
    type: q.type,
    difficulty: q.difficulty,
    group_id: q.group_id ?? null,
    group_title: q.group_title ?? null,
    group_order: q.group_order ?? null,
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
