import { NextResponse } from "next/server";
// Mundur 4 langkah karena foldernya sudah masuk ke dalam /api/
import { createClient } from "@/utils/supabase/server"; 

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Jika belum login, tolak akses
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ambil profil dari tabel 'Guru' di Supabase
    const { data: guru, error: errorGuru } = await supabase
      .from("Guru")
      .select("nama, sekolah_id")
      .eq("email", user.email)
      .single();

    // Jika data guru belum ada di tabel, kirim error 404
    if (errorGuru || !guru) {
      return NextResponse.json({ error: "Guru tidak ditemukan di tabel" }, { status: 404 });
    }

    // 2. Ambil nama sekolah
    const { data: sekolah } = await supabase
      .from("Sekolah")
      .select("nama")
      .eq("id", guru.sekolah_id)
      .single();

    // 3. Hitung jumlah santri berdasarkan sekolah
    const { count } = await supabase
      .from("Santri")
      .select("*", { count: 'exact', head: true })
      .eq("sekolah_id", guru.sekolah_id);

    // 4. Kirim semua data ke Dashboard
    return NextResponse.json({
      nama: guru.nama,
      sekolahNama: sekolah?.nama || "TarbiyahTech",
      jumlahSantri: count || 0
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}