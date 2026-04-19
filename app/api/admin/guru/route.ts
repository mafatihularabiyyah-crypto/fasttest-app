import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server"; // Helper untuk membaca sesi login

export const runtime = 'edge';
export const dynamic = "force-dynamic";

// Klien Khusus ADMIN (Service Role) untuk membuat akun tanpa ter-logout
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// MENGAMBIL DAFTAR GURU (Hanya Se-Sekolah)
// ==========================================
export async function GET(req: Request) {
  try {
    const supabase = await createClient(); // Cek siapa yang login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Akses ditolak: Sesi tidak ditemukan.");

    // Cari tahu ID Sekolah Admin ini
    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    // Ambil guru yang role-nya 'guru' dan satu sekolah dengan Admin
    const { data, error } = await supabaseAdmin
      .from('Guru')
      .select('*')
      .eq('role', 'guru')
      .eq('sekolah_id', adminProfil?.sekolah_id) 
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// MEMBUAT AKUN GURU BARU (Otomatis 1 Sekolah)
// ==========================================
export async function POST(req: Request) {
  try {
    const supabase = await createClient(); // Cek siapa yang login
    const body = await req.json();
    const { nama, email, password } = body;

    // 1. Ambil data Admin yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Tidak ada sesi login aktif");

    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    if (!adminProfil) throw new Error("Profil admin tidak ditemukan");

    // 2. Buat Akun Auth menggunakan ID Sekolah si Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { sekolah_id: adminProfil.sekolah_id },
      email_confirm: true
    });

    if (authError) throw authError;
    
    // Perbaikan Error TS: Pastikan user benar-benar tercipta
    if (!authData.user) throw new Error("Sistem gagal menghasilkan ID User");

    // 3. Simpan profil guru ke database
    const { error: dbError } = await supabaseAdmin
      .from('Guru')
      .insert({
        id: authData.user.id,
        nama: nama,
        email: email,
        role: 'guru',
        sekolah_id: adminProfil.sekolah_id // Otomatis disamakan dengan Admin
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Akun guru berhasil dibuat!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// MENGHAPUS AKUN GURU
// ==========================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID Guru tidak ditemukan" }, { status: 400 });

    // Hapus dari Auth Supabase
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    // Hapus dari Tabel Guru
    await supabaseAdmin.from('Guru').delete().eq('id', id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 