import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fixed whitelist — students may only add these tags
const WHITELIST = new Set([
  "題型::單選",
  "題型::閱讀",
  "題型::克漏字",
  "題型::文法",
  "題型::單字",
  "考試::會考",
  "考試::學測",
  "考試::TOEIC",
  "字彙級別::2000單",
  "字彙級別::4000單",
  "字彙級別::7000單",
  "難度::簡單",
  "難度::中等",
  "難度::困難",
]);

async function findOrCreateTag(
  name: string,
  category: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("tags")
    .insert({ name, category })
    .select("id")
    .maybeSingle();

  if (created) return created.id;

  // Race condition: another request inserted first — fetch again
  const { data: retry } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();

  return retry?.id ?? null;
}

async function getTagsForQuestion(questionId: string) {
  // Two-step query: avoids relying on PostgREST FK schema cache
  const { data: qtRows } = await supabase
    .from("question_tags")
    .select("tag_id")
    .eq("question_id", questionId);

  if (!qtRows || qtRows.length === 0) return [];

  const tagIds = (qtRows as { tag_id: string }[]).map((r) => r.tag_id);

  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, category")
    .in("id", tagIds);

  return (tags ?? []) as { id: string; name: string; category: string }[];
}

export async function GET(req: NextRequest) {
  const questionId = req.nextUrl.searchParams.get("question_id");
  if (!questionId) {
    return NextResponse.json({ error: "Missing question_id" }, { status: 400 });
  }

  const tags = await getTagsForQuestion(questionId);
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  // Auth check — any logged-in user may tag
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.slice(7)
  );
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { question_id, tags } = body as {
    question_id: string;
    tags: { name: string; category: string }[];
  };

  if (!question_id || !Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json(
      { error: "Missing question_id or tags" },
      { status: 400 }
    );
  }

  // Whitelist filter
  const allowed = tags.filter((t) => WHITELIST.has(`${t.category}::${t.name}`));
  if (allowed.length === 0) {
    return NextResponse.json({ error: "No valid tags" }, { status: 400 });
  }

  for (const tag of allowed) {
    const tagId = await findOrCreateTag(tag.name, tag.category);
    if (!tagId) continue;

    // Upsert with ignore-duplicate so concurrent clicks are harmless
    await supabase
      .from("question_tags")
      .upsert(
        { question_id, tag_id: tagId },
        { onConflict: "question_id,tag_id", ignoreDuplicates: true }
      );
  }

  const updatedTags = await getTagsForQuestion(question_id);
  return NextResponse.json({ tags: updatedTags });
}
