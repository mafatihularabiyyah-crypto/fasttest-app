export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ... sisa kode import dan GET/POST Ustadz di bawahnya ...

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';

// ==========================================
// 1. MENGAMBIL DATA SANTRI (GET)
// ==========================================
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });

    // Cek ID Sekolah Admin
    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    if (!adminProfil?.sekolah_id) {
        return NextResponse.json([], { status: 200 }); // Kembalikan kosong jika tidak ada sekolah
    }

    // Ambil data santri, urutkan berdasarkan kelas lalu nama
    const { data, error } = await supabase
      .from('Santri')
      .select('*')
      .eq('sekolah_id', adminProfil.sekolah_id)
      .order('kelas', { ascending: true })
      .order('nama', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 2. MENAMBAH SANTRI BARU (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { nama, nis, nisn, kelas, jenis_kelamin } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Tidak ada sesi login aktif");

    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    if (!adminProfil?.sekolah_id) throw new Error("Profil admin tidak valid");

    // Insert ke database (NISN opsional, jika kosong jadi null)
    const { error: insertError } = await supabase.from('Santri').insert({
      nama: nama,
      nis: nis,
      nisn: nisn || null, 
      kelas: kelas,
      jenis_kelamin: jenis_kelamin || 'L',
      status: 'Aktif',
      sekolah_id: adminProfil.sekolah_id 
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: "Santri berhasil ditambahkan" }, { status: 201 });
  } catch (error: any) {
    console.log("❌ ERROR POST SANTRI:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 3. MENGEDIT DATA SANTRI (PUT)
// ==========================================
export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, nama, nis, nisn, kelas, jenis_kelamin } = body;

    if (!id) throw new Error("ID Santri tidak ditemukan");

    // Lakukan update ke baris data yang ID-nya cocok
    const { error } = await supabase
      .from('Santri')
      .update({ 
        nama: nama, 
        nis: nis, 
        nisn: nisn || null,
        kelas: kelas,
        jenis_kelamin: jenis_kelamin
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Data santri diperbarui!" }, { status: 200 });
  } catch (error: any) {
    console.log("❌ ERROR PUT SANTRI:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 4. MENGHAPUS SANTRI (DELETE)
// ==========================================
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error("ID tidak valid");

    const { error } = await supabase.from('Santri').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.log("❌ ERROR DELETE SANTRI:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}