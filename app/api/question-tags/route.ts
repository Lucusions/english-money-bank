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

// Returns tag id, or null + the actual error string so callers can surface it
async function findOrCreateTag(
  name: string,
  category: string
): Promise<{ id: string | null; err: string | null }> {
  // 1. Try to find
  const { data: existing, error: selErr } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();

  if (selErr) {
    console.error("[tags] SELECT failed:", selErr);
    return { id: null, err: `tags.select: ${selErr.message} (${selErr.code})` };
  }
  if (existing) return { id: existing.id as string, err: null };

  // 2. Insert
  const { data: created, error: insErr } = await supabase
    .from("tags")
    .insert({ name, category })
    .select("id")
    .maybeSingle();

  if (created) return { id: created.id as string, err: null };

  if (insErr) {
    console.error("[tags] INSERT failed:", insErr);

    // Unique-violation means concurrent insert won the race; retry select
    if (insErr.code === "23505") {
      const { data: retry } = await supabase
        .from("tags")
        .select("id")
        .eq("name", name)
        .eq("category", category)
        .maybeSingle();
      if (retry) return { id: retry.id as string, err: null };
    }

    return { id: null, err: `tags.insert: ${insErr.message} (${insErr.code})` };
  }

  return { id: null, err: "tags.insert: no data returned" };
}

// Returns ok + actual error string so callers can surface it
async function linkTagToQuestion(
  questionId: string,
  tagId: string
): Promise<{ ok: boolean; err: string | null }> {
  // Check if already linked
  const { data: existing, error: selErr } = await supabase
    .from("question_tags")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("tag_id", tagId)
    .maybeSingle();

  if (selErr) {
    console.error("[question_tags] SELECT failed:", selErr);
    return { ok: false, err: `question_tags.select: ${selErr.message} (${selErr.code})` };
  }
  if (existing) return { ok: true, err: null }; // already linked, fine

  // Insert
  const { error: insErr } = await supabase
    .from("question_tags")
    .insert({ question_id: questionId, tag_id: tagId });

  if (insErr) {
    console.error("[question_tags] INSERT failed:", insErr);
    // 23505 = unique_violation (concurrent request beat us here)
    if (insErr.code === "23505") return { ok: true, err: null };
    return {
      ok: false,
      err: `question_tags.insert: ${insErr.message} (${insErr.code})`,
    };
  }

  console.log("[question_tags] inserted question_id:", questionId, "tag_id:", tagId);
  return { ok: true, err: null };
}

async function getTagsForQuestion(
  questionId: string
): Promise<{ id: string; name: string; category: string }[]> {
  const { data: qtRows, error: qtErr } = await supabase
    .from("question_tags")
    .select("tag_id")
    .eq("question_id", questionId);

  if (qtErr) {
    console.error("[question_tags] SELECT error:", qtErr);
    return [];
  }
  if (!qtRows || qtRows.length === 0) return [];

  const tagIds = (qtRows as { tag_id: string }[]).map((r) => r.tag_id);

  const { data: tags, error: tagsErr } = await supabase
    .from("tags")
    .select("id, name, category")
    .in("id", tagIds);

  if (tagsErr) {
    console.error("[tags] SELECT error:", tagsErr);
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
  // ── Auth ────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.slice(7));

  if (authError || !user) {
    console.error("[question-tags] auth failed:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────
  let body: { question_id?: string; tags?: { name: string; category: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question_id, tags } = body;
  console.log("[question-tags] POST user:", user.id, "question_id:", question_id, "tags:", tags);

  if (!question_id || !Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: "Missing question_id or tags" }, { status: 400 });
  }

  // ── Whitelist ────────────────────────────────────────────────
  const allowed = tags.filter((t) => WHITELIST.has(`${t.category}::${t.name}`));
  if (allowed.length === 0) {
    return NextResponse.json({ error: "No valid tags" }, { status: 400 });
  }

  // ── Sanity-check table access ────────────────────────────────
  const { error: tagsCheck } = await supabase.from("tags").select("id").limit(1);
  if (tagsCheck) {
    console.error("[question-tags] tags table not accessible:", tagsCheck);
    return NextResponse.json(
      { error: "Cannot access tags table", detail: tagsCheck.message, code: tagsCheck.code },
      { status: 500 }
    );
  }

  const { error: qtCheck } = await supabase.from("question_tags").select("question_id").limit(1);
  if (qtCheck) {
    console.error("[question-tags] question_tags table not accessible:", qtCheck);
    return NextResponse.json(
      { error: "Cannot access question_tags table", detail: qtCheck.message, code: qtCheck.code },
      { status: 500 }
    );
  }

  // ── Process tags ─────────────────────────────────────────────
  const dbErrors: string[] = [];

  for (const tag of allowed) {
    const { id: tagId, err: tagErr } = await findOrCreateTag(tag.name, tag.category);

    if (!tagId) {
      dbErrors.push(tagErr ?? `findOrCreateTag returned null for ${tag.category}::${tag.name}`);
      continue;
    }

    const { ok, err: linkErr } = await linkTagToQuestion(question_id, tagId);
    if (!ok) {
      dbErrors.push(linkErr ?? `linkTagToQuestion failed for tagId=${tagId}`);
    }
  }

  const updatedTags = await getTagsForQuestion(question_id);
  console.log("[question-tags] result — tags:", updatedTags.length, "errors:", dbErrors);

  if (dbErrors.length > 0 && updatedTags.length === 0) {
    return NextResponse.json(
      { error: "Failed to save tags", detail: dbErrors[0], all: dbErrors },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, tags: updatedTags });
}
