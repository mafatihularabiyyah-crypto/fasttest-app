export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ==========================================
// MENGAMBIL DAFTAR TEMPLATE (GET)
// ==========================================
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Ambil semua template yang ada di database, urutkan dari yang terbaru
    const { data, error } = await supabase
      .from('TemplateLJK')
      .select('id, nama_template, jumlah_soal, jumlah_opsi, struktur_kanvas_json, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Gagal mengambil template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// MENYIMPAN TEMPLATE BARU (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    
    const { nama_template, jumlah_soal, jumlah_opsi, struktur_kanvas_json } = body;

    // Ambil sesi user untuk mendapatkan ID Sekolah (Opsional, agar template spesifik per sekolah)
    const { data: { user } } = await supabase.auth.getUser();
    let sekolahId = "DEFAULT_SCHOOL"; // Fallback jika tidak ada sistem multi-sekolah
    
    if (user) {
      const { data: guru } = await supabase.from("Guru").select("sekolah_id").eq("email", user.email).single();
      if (guru) sekolahId = guru.sekolah_id;
    }

    // Masukkan data ke tabel TemplateLJK
    const { data, error } = await supabase
      .from('TemplateLJK')
      .insert({
        sekolah_id: sekolahId,
        nama_template,
        jumlah_soal,
        jumlah_opsi,
        struktur_kanvas_json
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, template: data }, { status: 201 });
  } catch (error: any) {
    console.error("Gagal menyimpan template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// MENGHAPUS TEMPLATE (DELETE)
// ==========================================
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID Template tidak ditemukan" }, { status: 400 });
    
    const { error } = await supabase.from('TemplateLJK').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Gagal menghapus template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}