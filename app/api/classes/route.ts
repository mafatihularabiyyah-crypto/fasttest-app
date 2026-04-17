import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Memastikan data selalu segar (tidak di-cache)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Cek apakah user sudah login
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Nanti jika Anda sudah membuat tabel "Kelas" di Supabase, buka komentar di bawah ini:
    // const { data: kelas, error } = await supabase.from("Kelas").select("*");
    // if (error) throw error;
    // return NextResponse.json({ data: kelas }, { status: 200 });

    // Respon sementara agar aplikasi tidak error
    return NextResponse.json({ 
      message: "API Kelas terhubung, tapi tabel belum dibuat.",
      data: [] 
    }, { status: 200 });

  } catch (error) {
    console.log("Error API Classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}