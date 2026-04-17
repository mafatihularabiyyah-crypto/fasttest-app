import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ambil data dari tabel Guru manual
    const { data: guru } = await supabase
      .from("Guru")
      .select("nama, sekolah_id")
      .eq("email", user.email)
      .single();

    if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });

    // Ambil Nama Sekolah
    const { data: sekolah } = await supabase
      .from("Sekolah")
      .select("nama")
      .eq("id", guru.sekolah_id)
      .single();

    // Hitung Santri
    const { count } = await supabase
      .from("Santri")
      .select("*", { count: 'exact', head: true })
      .eq("sekolah_id", guru.sekolah_id);

    return NextResponse.json({
      nama: guru.nama,
      sekolahNama: sekolah?.nama || "TarbiyahTech",
      jumlahSantri: count || 0
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}