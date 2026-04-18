import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; 

export const runtime = 'edge';
// 🚨 ANTI-CACHE (SANGAT PENTING!) 🚨
// Ini memaksa Next.js untuk selalu mengambil data baru, bukan data memori lama
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("=== API PROFILE DIPANGGIL ===");
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("Status: User belum login");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("1. Email yang dipakai Login sekarang:", user.email);

    // 1. Ambil profil dari tabel 'Guru'
    const { data: guru, error: errorGuru } = await supabase
      .from("Guru")
      .select("nama, sekolah_id")
      .eq("email", user.email)
      .single();

    if (errorGuru) {
       console.log("2. Error Supabase saat mencari Guru:", errorGuru);
    }
    
    console.log("3. Hasil pencarian data Guru:", guru);

    if (errorGuru || !guru) {
      return NextResponse.json({ error: "Guru tidak ditemukan di tabel" }, { status: 404 });
    }

    // 2. Ambil nama sekolah
    const { data: sekolah } = await supabase
      .from("Sekolah")
      .select("nama")
      .eq("id", guru.sekolah_id)
      .single();

    // 3. Hitung jumlah santri
    const { count } = await supabase
      .from("Santri")
      .select("*", { count: 'exact', head: true })
      .eq("sekolah_id", guru.sekolah_id);

    return NextResponse.json({
      nama: guru.nama,
      sekolahNama: sekolah?.nama || "TarbiyahTech",
      jumlahSantri: count || 0
    }, { status: 200 });

  } catch (error) {
    console.error("Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}