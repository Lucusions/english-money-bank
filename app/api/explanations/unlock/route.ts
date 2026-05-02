import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UNLOCK_COST = 10;

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.slice(7)
  );
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────
  let explanation_id: string | undefined;
  try {
    ({ explanation_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!explanation_id) {
    return NextResponse.json({ error: "Missing explanation_id" }, { status: 400 });
  }

  // ── Already unlocked? ─────────────────────────────────────────
  const { data: existing } = await supabase
    .from("explanation_unlocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("explanation_id", explanation_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, unlocked: true, already: true });
  }

  // ── Read wallet ───────────────────────────────────────────────
  const { data: wallet, error: walletErr } = await supabase
    .from("wallets")
    .select("free_tokens, paid_tokens")
    .eq("user_id", user.id)
    .single();

  if (walletErr || !wallet) {
    console.error("[unlock] wallet fetch error:", walletErr);
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const { free_tokens, paid_tokens } = wallet;
  const total = free_tokens + paid_tokens;

  if (total < UNLOCK_COST) {
    return NextResponse.json(
      { error: "代幣不足", required: UNLOCK_COST, available: total },
      { status: 402 }
    );
  }

  // ── Calculate deduction (free first, then paid) ───────────────
  const usedFree = Math.min(free_tokens, UNLOCK_COST);
  const usedPaid = UNLOCK_COST - usedFree;

  const newFree = free_tokens - usedFree;
  const newPaid = paid_tokens - usedPaid;

  // ── Deduct from wallet ────────────────────────────────────────
  const { error: walletUpdateErr } = await supabase
    .from("wallets")
    .update({ free_tokens: newFree, paid_tokens: newPaid })
    .eq("user_id", user.id);

  if (walletUpdateErr) {
    console.error("[unlock] wallet update error:", walletUpdateErr);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }

  // ── Create unlock record ──────────────────────────────────────
  const { error: unlockErr } = await supabase
    .from("explanation_unlocks")
    .insert({
      user_id: user.id,
      explanation_id,
      cost: UNLOCK_COST,
      used_free_tokens: usedFree,
      used_paid_tokens: usedPaid,
    });

  if (unlockErr) {
    // Rollback wallet if unlock insert fails
    console.error("[unlock] unlock insert error:", unlockErr);
    await supabase
      .from("wallets")
      .update({ free_tokens, paid_tokens })
      .eq("user_id", user.id);
    return NextResponse.json({ error: "Failed to create unlock record" }, { status: 500 });
  }

  // ── Create transaction record ─────────────────────────────────
  await supabase.from("wallet_transactions").insert({
    user_id: user.id,
    token_type: usedFree > 0 && usedPaid === 0 ? "free" : usedPaid > 0 && usedFree === 0 ? "paid" : "mixed",
    amount: -UNLOCK_COST,
    reason: "explanation_unlock",
    related_type: "explanation",
    related_id: explanation_id,
  });

  return NextResponse.json({ success: true, unlocked: true });
}
