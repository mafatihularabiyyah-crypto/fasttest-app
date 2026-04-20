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

    console.log("\n=== 🕵️ DEBUG: MENGAMBIL DATA GURU ===");
    console.log("1. ID Admin Login:", user.id);

    // Cari tahu ID Sekolah Admin ini
    const { data: adminProfil, error: adminError } = await supabase
      .from("Guru")
      .select("sekolah_id, role")
      .eq("id", user.id)
      .single();

    if (adminError) console.log("❌ ERROR Ambil Profil Admin:", adminError.message);
    console.log("2. Profil Admin:", adminProfil);

    // Jika Admin tidak punya sekolah_id, jangan paksa query, langsung kembalikan kosong
    if (!adminProfil || !adminProfil.sekolah_id) {
      console.log("⚠️ WARNING: Admin ini TIDAK PUNYA sekolah_id. Mengembalikan array kosong.");
      console.log("======================================\n");
      return NextResponse.json([], { status: 200 }); 
    }

    // Ambil guru yang role-nya 'guru' dan satu sekolah dengan Admin
    const { data, error } = await supabaseAdmin
      .from('Guru')
      .select('*')
      .eq('role', 'guru')
      .eq('sekolah_id', adminProfil.sekolah_id) 
      .order('created_at', { ascending: true });

    if (error) {
      console.log("❌ ERROR Mengambil Tabel Guru:", error.message);
      throw error;
    }
    
    console.log(`3. ✅ Ditemukan ${data?.length || 0} guru untuk sekolah ${adminProfil.sekolah_id}`);
    console.log("======================================\n");

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.log("❌ CATCH ERROR GET:", error.message);
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

    console.log("\n=== 🚀 DEBUG: MEMBUAT AKUN GURU BARU ===");
    console.log(`1. Target Email: ${email}`);

    // 1. Ambil data Admin yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Tidak ada sesi login aktif");

    const { data: adminProfil } = await supabase
      .from("Guru")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    console.log("2. ID Sekolah Admin:", adminProfil?.sekolah_id);

    if (!adminProfil || !adminProfil.sekolah_id) {
      throw new Error("Gagal: Akun Admin Anda belum memiliki ID Sekolah di database!");
    }

    // 2. Buat Akun Auth menggunakan ID Sekolah si Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { sekolah_id: adminProfil.sekolah_id },
      email_confirm: true
    });

    if (authError) {
      console.log("❌ ERROR Auth Create:", authError.message);
      throw authError;
    }
    
    if (!authData.user) throw new Error("Sistem gagal menghasilkan ID User");
    console.log("3. ✅ Akun Auth berhasil dibuat dengan UID:", authData.user.id);

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

    if (dbError) {
      console.log("❌ ERROR Tabel Guru Insert:", dbError.message);
      console.log("⚠️ Melakukan Auto-Rollback (Menghapus akun Auth)...");
      // Hapus akun dari Auth jika gagal simpan di database agar tidak nyangkut
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    console.log("4. ✅ Data profil Guru berhasil disimpan ke database!");
    console.log("========================================\n");

    return NextResponse.json({ success: true, message: "Akun guru berhasil dibuat!" }, { status: 201 });
  } catch (error: any) {
    console.log("❌ CATCH ERROR POST:", error.message);
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