import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer"; 

export async function GET() {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "gift-photos";

  const { data, error } = await supabaseAdmin
    .from("gifts")
    .select("gift_number, storage_path, media_type, caption, opened_at")
    .order("gift_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert storage_path -> public URL
  const gifts = data.map((g) => {
    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(g.storage_path);
    return { ...g, public_url: pub.publicUrl };
  });

  return NextResponse.json({ gifts });
}
