import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const questionId = req.nextUrl.searchParams.get("question_id");
  if (!questionId) {
    return NextResponse.json({ error: "Missing question_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("explanations")
    .select("id, content, created_at, teacher_id, profiles(display_name)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ explanations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("teacher_status")
    .eq("id", user.id)
    .single();

  if (profile?.teacher_status !== "approved") {
    return NextResponse.json(
      { error: "只有通過審核的老師才能新增詳解" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { question_id, content } = body;

  if (!question_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing question_id or content" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("explanations")
    .insert({ question_id, teacher_id: user.id, content: content.trim() })
    .select("id, content, created_at, teacher_id, profiles(display_name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ explanation: data });
}
