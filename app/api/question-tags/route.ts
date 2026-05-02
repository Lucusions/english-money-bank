import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  // Try to find existing tag
  const { data: existing, error: selectErr } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();

  if (selectErr) {
    console.error("[tags] select error:", selectErr.message);
    return null;
  }
  if (existing) return existing.id as string;

  // Insert new tag
  const { data: created, error: insertErr } = await supabase
    .from("tags")
    .insert({ name, category })
    .select("id")
    .maybeSingle();

  if (created) return created.id as string;

  // Race condition — another request inserted first, retry select
  if (insertErr) {
    const { data: retry } = await supabase
      .from("tags")
      .select("id")
      .eq("name", name)
      .eq("category", category)
      .maybeSingle();
    if (retry) return retry.id as string;
    console.error("[tags] insert+retry failed:", insertErr.message);
  }

  return null;
}

async function linkTagToQuestion(
  questionId: string,
  tagId: string
): Promise<boolean> {
  // Check first — avoids needing a unique constraint for dedup
  const { data: existing } = await supabase
    .from("question_tags")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("tag_id", tagId)
    .maybeSingle();

  if (existing) return true; // already linked

  const { error: insertErr } = await supabase
    .from("question_tags")
    .insert({ question_id: questionId, tag_id: tagId });

  if (insertErr) {
    // 23505 = unique_violation — concurrent request got there first, still fine
    if (insertErr.code === "23505") return true;
    console.error(
      "[question_tags] insert error:",
      insertErr.message,
      "code:",
      insertErr.code
    );
    return false;
  }

  return true;
}

async function getTagsForQuestion(
  questionId: string
): Promise<{ id: string; name: string; category: string }[]> {
  const { data: qtRows, error: qtErr } = await supabase
    .from("question_tags")
    .select("tag_id")
    .eq("question_id", questionId);

  if (qtErr) {
    console.error("[question_tags] select error:", qtErr.message);
    return [];
  }
  if (!qtRows || qtRows.length === 0) return [];

  const tagIds = (qtRows as { tag_id: string }[]).map((r) => r.tag_id);

  const { data: tags, error: tagsErr } = await supabase
    .from("tags")
    .select("id, name, category")
    .in("id", tagIds);

  if (tagsErr) {
    console.error("[tags] select error:", tagsErr.message);
    return [];
  }

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

  let body: { question_id?: string; tags?: { name: string; category: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question_id, tags } = body;
  if (!question_id || !Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json(
      { error: "Missing question_id or tags" },
      { status: 400 }
    );
  }

  const allowed = tags.filter((t) => WHITELIST.has(`${t.category}::${t.name}`));
  if (allowed.length === 0) {
    return NextResponse.json({ error: "No valid tags" }, { status: 400 });
  }

  const failures: string[] = [];

  for (const tag of allowed) {
    const tagId = await findOrCreateTag(tag.name, tag.category);
    if (!tagId) {
      failures.push(`${tag.category}::${tag.name}`);
      continue;
    }

    const ok = await linkTagToQuestion(question_id, tagId);
    if (!ok) failures.push(`link:${tag.category}::${tag.name}`);
  }

  const updatedTags = await getTagsForQuestion(question_id);

  if (failures.length > 0 && updatedTags.length === 0) {
    return NextResponse.json(
      { error: "Failed to save tags", details: failures },
      { status: 500 }
    );
  }

  return NextResponse.json({ tags: updatedTags });
}
