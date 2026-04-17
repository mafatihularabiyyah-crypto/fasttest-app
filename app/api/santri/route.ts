import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Cari tahu guru ini mengajar di sekolah mana
    const { data: guru } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("email", user.email)
      .single();

    if (!guru || !guru.sekolah_id) {
      return NextResponse.json({ data: [] }, { status: 200 }); // Kembalikan array kosong jika tidak ada sekolah
    }

    // 2. Ambil semua data Santri yang satu sekolah dengan guru tersebut
    const { data: santri, error } = await supabase
      .from("Santri")
      .select("*")
      .eq("sekolah_id", guru.sekolah_id)
      .order("nama", { ascending: true }); // Urutkan sesuai abjad

    if (error) {
      console.log("Error ambil santri:", error);
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: santri }, { status: 200 });

  } catch (error) {
    console.log("Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}