export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ... sisa kode import dan GET/POST Ustadz di bawahnya ...

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';

// ==========================================
// 1. MENGAMBIL DAFTAR TEMPLATE (GET)
// ==========================================
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Cek Sesi Login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Akses ditolak: Sesi tidak valid" }, { status: 401 });

    // Cek ID Sekolah
    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    if (!adminProfil?.sekolah_id) return NextResponse.json([], { status: 200 });

    // Ambil data template berdasarkan sekolah
    const { data, error } = await supabase
      .from('TemplateLJK')
      .select('*')
      .eq('sekolah_id', adminProfil.sekolah_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 2. MENYIMPAN MASTER TEMPLATE (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    
    // Menangkap data dari Editor Admin (termasuk konfigurasi_json)
    const { nama_template, jumlah_soal, opsi, kolom, konfigurasi_json } = body;

    // Cek Autentikasi dan ID Sekolah
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Tidak ada sesi login yang aktif.");

    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    if (!adminProfil?.sekolah_id) throw new Error("Profil admin tidak valid atau sekolah tidak ditemukan.");

    // Proses Insert ke Database
    const { error } = await supabase.from('TemplateLJK').insert({
      nama_template, 
      jumlah_soal, 
      opsi, 
      kolom,
      konfigurasi_json, // Menyimpan desain detail (Kop, Logo, dll)
      sekolah_id: adminProfil.sekolah_id 
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Template berhasil disimpan" }, { status: 201 });
  } catch (error: any) {
    console.error("❌ ERROR POST TEMPLATE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 3. MENGHAPUS TEMPLATE (DELETE)
// ==========================================
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error("ID Template tidak valid");

    // Hapus dari database
    const { error } = await supabase
      .from('TemplateLJK')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR DELETE TEMPLATE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}