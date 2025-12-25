import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer"; 

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const gift_number = body?.gift_number;

  if (!Number.isInteger(gift_number) || gift_number < 1 || gift_number > 53) {
    return NextResponse.json({ error: "Invalid gift_number" }, { status: 400 });
  }

  // Only set opened_at if it isn't already set (keeps first-open time)
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("gifts")
    .update({ opened_at: now })
    .eq("gift_number", gift_number)
    .is("opened_at", null)
    .select("gift_number, opened_at")
    .single();

  if (error) {
    // If it was already opened, no rows updated; handle gracefully:
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("gifts")
      .select("gift_number, opened_at")
      .eq("gift_number", gift_number)
      .single();

    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    return NextResponse.json({ gift: existing });
  }

  return NextResponse.json({ gift: data });
}
