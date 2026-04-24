export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // TODO: Buat tabel di Supabase dan ganti query di bawah ini nantinya
    // Contoh: const { data } = await supabase.from("NamaTabel").select("*");

    return NextResponse.json({ 
      message: "API terhubung, tapi tabel belum dibuat.",
      data: [] 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Menyiapkan fungsi POST untuk menyimpan data baru (contoh menyimpan hasil LJK)
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // TODO: Simpan data ke tabel Supabase
    // Contoh: await supabase.from("Ujian").insert([body]);

    return NextResponse.json({ success: true, message: "Data diterima" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}