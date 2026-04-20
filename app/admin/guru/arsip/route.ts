import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Akses ditolak: Sesi tidak ditemukan.");

    // Ambil Parameter ID Guru dari URL
    const { searchParams } = new URL(req.url);
    const guruId = searchParams.get('guru_id');
    if (!guruId) throw new Error("ID Guru tidak valid.");

    // 1. Ambil Nama Guru tersebut
    const { data: profilGuru } = await supabaseAdmin
      .from("Guru")
      .select("nama, email")
      .eq("id", guruId)
      .single();

    // 2. Ambil Daftar Ujian yang pernah dibuat guru ini
    // (Asumsi Anda memiliki tabel "Ujian" dengan kolom "guru_id")
    const { data: daftarUjian, error } = await supabaseAdmin
      .from('Ujian')
      .select('*')
      .eq('guru_id', guruId)
      .order('created_at', { ascending: false });

    // Jika tabel Ujian belum ada, jangan sampai error, kembalikan array kosong
    if (error && error.code === '42P01') {
       return NextResponse.json({ profil: profilGuru, arsip: [] }, { status: 200 });
    }

    return NextResponse.json({ profil: profilGuru, arsip: daftarUjian || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}